"use client"
import React, { useEffect, useMemo, useRef } from 'react'
import type {
  CircleLayerSpecification,
  GeoJSONSource,
  MapMouseEvent,
  Popup,
} from 'mapbox-gl'
import { useMap } from '@/components/map/hooks/useMap'
import { showReactPopup } from '@/components/map/primitives/popupHelper'
import { ProvinceSummaryData } from '@/types/tracking/detail-gps-api'

interface Props {
  provinces: ProvinceSummaryData[]
}

const SOURCE_ID = 'gps-province-traffic-src'
const LAYER_ID = 'gps-province-traffic-layer'

const isValidCoord = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)

// Same 4-stop gradient as the legend bar (#8F8F8F -> #FFB100 -> #FF6600 -> #FF0000).
const COLOR_STOPS: { at: number; rgb: [number, number, number] }[] = [
  { at: 0, rgb: [143, 143, 143] },
  { at: 0.4135, rgb: [255, 177, 0] },
  { at: 0.7885, rgb: [255, 102, 0] },
  { at: 1, rgb: [255, 0, 0] },
]

const interpolateColor = (t: number): string => {
  const clamped = Math.max(0, Math.min(1, t))
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const a = COLOR_STOPS[i]
    const b = COLOR_STOPS[i + 1]
    if (clamped >= a.at && clamped <= b.at) {
      const localT = b.at > a.at ? (clamped - a.at) / (b.at - a.at) : 0
      const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * localT)
      const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * localT)
      const bl = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * localT)
      return `rgb(${r},${g},${bl})`
    }
  }
  return '#FF0000'
}

type ProvinceFeature = GeoJSON.Feature<GeoJSON.Point, {
  province_name: string
  road_count: number
  vehicles_now: number
  vehicles_today: number
  radius: number
  color: string
}>

const ProvincePopup: React.FC<{ feature: ProvinceFeature }> = ({ feature }) => {
  const p = feature.properties
  const pct = p.vehicles_today > 0 ? Math.round((p.vehicles_now / p.vehicles_today) * 100) : 0
  const rows: [string, string][] = [
    ['สายทาง ทช. ในจังหวัด', p.road_count.toLocaleString()],
    ['รถบนสาย ทช. ตอนนี้', p.vehicles_now.toLocaleString()],
    ['รถบนสาย ทช. วันนี้', p.vehicles_today.toLocaleString()],
    ['เปรียบเทียบรถบนสายทาง', `${pct}%`],
  ]
  return (
    <div className='min-w-56 rounded-lg border border-(--yellow) px-4 py-3 bg-(--dark-black)'>
      <p className='fs-14 font-semibold text-white mb-2'>{p.province_name}</p>
      <div className='flex flex-col gap-1.5'>
        {rows.map(([label, value]) => (
          <div key={label} className='flex items-center justify-between gap-4'>
            <span className='fs-12 text-gray-400'>{label}</span>
            <span className='fs-12 text-(--yellow) font-semibold'>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Province traffic bubble layer — circle radius + color both scale with
 * `vehicles_now` (bigger/redder = busier), matching the "รถบนสายทาง ทช."
 * gradient legend. Radius/color are precomputed per-feature in JS and read
 * via plain `['get', 'radius']` / `['get', 'color']` rather than Mapbox
 * `interpolate` paint expressions — simpler to reason about and to test.
 *
 * Uses raw Mapbox source/layer (not the shared `MarkerLayer` primitive)
 * because it also needs a hover-triggered (not click-triggered) popup, which
 * `MarkerLayer` doesn't support.
 */
const ProvinceTrafficLayer: React.FC<Props> = ({ provinces }) => {
  const { map, isLoaded } = useMap()
  const popupRef = useRef<Popup | null>(null)
  const hoveredFeatureIdRef = useRef<string | number | undefined>(undefined)

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(() => {
    const valid = provinces
      .map((p) => ({ p, lat: Number(p.avg_lat), lng: Number(p.avg_lng) }))
      .filter(({ lat, lng }) => isValidCoord(lat, lng))

    const values = valid.map(({ p }) => p.vehicles_now).filter((v) => Number.isFinite(v))
    const min = values.length ? Math.min(...values) : 0
    const rawMax = values.length ? Math.max(...values) : 1
    const max = rawMax > min ? rawMax : min + 1

    return {
      type: 'FeatureCollection',
      features: valid.map(({ p, lat, lng }) => {
        const t = (p.vehicles_now - min) / (max - min)
        return {
          type: 'Feature',
          properties: {
            province_name: p.province_name,
            road_count: p.road_count,
            vehicles_now: p.vehicles_now,
            vehicles_today: p.vehicles_today,
            radius: 6 + Math.max(0, Math.min(1, t)) * (40 - 6),
            color: interpolateColor(t),
          },
          geometry: { type: 'Point', coordinates: [lng, lat] },
        }
      }),
    }
  }, [provinces])

  // Always-latest ref so `ensureLayer` (which can be re-invoked later by the
  // `styledata` listener/poll, long after this effect's own closure was
  // created) never rebuilds the source with stale data.
  const geojsonRef = useRef(geojson)
  geojsonRef.current = geojson

  useEffect(() => {
    if (!map || !isLoaded) return

    // Mapbox stores custom sources/layers on the STYLE, not the map instance —
    // sibling layers that mutate style config (e.g. RoadLayer's
    // `setConfigProperty` on the Standard style's `basemap` import to mute
    // base roads) can trigger an internal style reload that silently drops
    // any custom layer added earlier, with no error and no event on the
    // layer itself. `ensureLayer` re-adds ours whenever that happens by
    // listening to `styledata` (Mapbox's own recommended fix — see
    // https://docs.mapbox.com/mapbox-gl-js/example/style-switch/), plus a
    // polling safety net as a cheap extra guarantee.
    const ensureLayer = () => {
      if (map.getSource(SOURCE_ID) && map.getLayer(LAYER_ID)) return

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: geojsonRef.current,
          generateId: true,
        })
      }

      if (!map.getLayer(LAYER_ID)) {
        const layerSpec: CircleLayerSpecification = {
          id: LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          paint: {
            'circle-radius': ['get', 'radius'],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.8,
            'circle-stroke-width': 1,
            // NOT '#ffffff66' — Mapbox GL's color parser doesn't accept the
            // 8-digit hex-with-alpha (#RRGGBBAA) format and silently drops
            // the whole `addLayer` call (no thrown error, layer just never
            // appears) when it's used alongside data-driven paint properties.
            'circle-stroke-color': 'rgba(255,255,255,0.4)',
          },
        }
        map.addLayer(layerSpec)
      }
    }

    ensureLayer()
    map.on('styledata', ensureLayer)
    const pollId = window.setInterval(ensureLayer, 1000)

    const closePopup = () => {
      popupRef.current?.remove()
      popupRef.current = null
      hoveredFeatureIdRef.current = undefined
    }

    const handleMouseMove = (e: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      const feature = e.features?.[0] as ProvinceFeature | undefined
      if (!feature || feature.geometry.type !== 'Point') return
      // Same feature the cursor is already over — skip (avoid re-render per pixel of movement).
      if (feature.id === hoveredFeatureIdRef.current) return
      hoveredFeatureIdRef.current = feature.id

      map.getCanvas().style.cursor = 'pointer'
      import('mapbox-gl').then(({ default: mb }) => {
        if (feature.id !== hoveredFeatureIdRef.current) return
        popupRef.current = showReactPopup({
          map,
          mb,
          lngLat: feature.geometry.coordinates as [number, number],
          content: <ProvincePopup feature={feature} />,
          options: { closeButton: false },
        })
      })
    }

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ''
      closePopup()
    }

    map.on('mousemove', LAYER_ID, handleMouseMove)
    map.on('mouseleave', LAYER_ID, handleMouseLeave)

    return () => {
      window.clearInterval(pollId)
      try {
        map.off('styledata', ensureLayer)
        map.off('mousemove', LAYER_ID, handleMouseMove)
        map.off('mouseleave', LAYER_ID, handleMouseLeave)
        closePopup()
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // Map already torn down — ignore
      }
    }
    // `geojson` intentionally excluded — data updates go through the setData
    // effect below (and through the ref `ensureLayer` reads), instead of
    // rebuilding the layer on every data change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded])

  // Update data without rebuilding the layer.
  useEffect(() => {
    if (!map || !isLoaded) return
    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (src) src.setData(geojson)
  }, [map, isLoaded, geojson])

  return null
}

export default React.memo(ProvinceTrafficLayer)
