"use client"
import React, { useEffect, useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import { useMap } from '@/components/map/hooks/useMap'
import { useTunnelOverview } from '@/hooks/queries/tunnel'
import { useDeptId } from '@/hooks/useDeptId'
import type { TunnelLocation } from '@/types/tunnel/overview-api'

interface Props { }

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

type TunnelFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  Record<string, unknown>
>

/** A usable [lng, lat] — drops null / malformed / [0,0]. One bad point makes
 *  Mapbox reject the WHOLE GeoJSON source → no markers at all. */
const isValidCoord = (g: unknown): g is [number, number] =>
  Array.isArray(g) && g.length === 2 &&
  typeof g[0] === 'number' && typeof g[1] === 'number' &&
  !(g[0] === 0 && g[1] === 0)

/** Convert raw API locations → GeoJSON FeatureCollection for MarkerLayer.
 *  Defensive across every nested field — guards against partial rows. */
const toGeoJSON = (locations: TunnelLocation[]): TunnelFeatureCollection => ({
  type: 'FeatureCollection',
  features: locations
    .filter((loc) => loc && isValidCoord(loc.GeometryPoint))
    .map((loc) => ({
      type: 'Feature',
      properties: {
        id: loc.solution?.id ?? null,
        solution_name: loc.solution?.solution_name ?? '',
        code_name: loc.road?.code_name ?? '',
        camera_count: loc.tunnel?.camera_count ?? 0,
        lighting_count: loc.tunnel?.lighting_count ?? 0,
        is_active: loc.tunnel?.is_online ?? false,
      },
      geometry: { type: 'Point', coordinates: loc.GeometryPoint },
    })),
})

/** Popup card shown on marker click — info-only, no detail link.
 *  Row clicks in the table + card grid open the tunnel's live URL in a modal;
 *  the map popup deliberately stops at read-only info to keep the marker
 *  interaction light. */
const TunnelPopup: React.FC<{ feature: GeoJSON.Feature }> = ({ feature }) => {
  const p = feature.properties as Record<string, unknown>
  return (
    <div
      className='min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)]'
      style={{ borderColor: '#B57BFF' }}
    >
      <p
        className='fs-11 font-bold tracking-wide'
        style={{ color: '#B57BFF' }}
      >
        Tunnel · {String(p.code_name)}
      </p>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
        {String(p.solution_name)}
      </p>
      <p className='fs-11 text-white mt-1.5'>
        กล้องทั้งหมด: {Number(p.camera_count ?? 0).toLocaleString()} กล้อง
      </p>
      <p className='fs-11 text-white'>
        ไฟส่องสว่าง: {Number(p.lighting_count ?? 0).toLocaleString()} ดวง
      </p>
    </div>
  )
}

// ─── Marker layer group (runs inside MapContext) ──────────────────────────────

interface MarkerLayerGroupProps {
  locations: TunnelLocation[]
  centroid: [number, number] | null
  isReady: boolean
}

const TunnelMarkerLayer: React.FC<MarkerLayerGroupProps> = ({
  locations,
  centroid,
  isReady,
}) => {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded || !isReady) return

    const valid = (locations ?? [])
      .map((l) => l?.GeometryPoint)
      .filter(
        (pt): pt is [number, number] =>
          Array.isArray(pt) &&
          pt.length === 2 &&
          !(pt[0] === 0 && pt[1] === 0)
      )

    if (valid.length === 0) {
      if (centroid && (centroid[0] !== 0 || centroid[1] !== 0)) {
        map.flyTo({ center: centroid, zoom: 6, duration: 1200 })
      }
      return
    }

    if (valid.length === 1) {
      map.flyTo({ center: valid[0], zoom: 13, duration: 1200 })
      return
    }

    let minLng = valid[0][0],
      maxLng = valid[0][0],
      minLat = valid[0][1],
      maxLat = valid[0][1]
    for (const [lng, lat] of valid) {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 60, maxZoom: 12, duration: 1200 }
    )
  }, [map, isLoaded, isReady, locations, centroid])

  const allData = useMemo(() => toGeoJSON(locations), [locations])

  if (!isReady) return null

  return (
    <DeviceMarkerLayer
      type='Tunnel'
      id='tunnel'
      data={allData}
      cluster
      size={18}
      popup={(f) => <TunnelPopup feature={f} />}
      popupOptions={{ offset: 10, closeButton: false }}
    />
  )
}

// ─── Map shell ─────────────────────────────────────────────────────────────────

const MapTunnel: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { data, isLoading, isSuccess } = useTunnelOverview(deptId)

  const centroidValid =
    !!data?.centroid && (data.centroid[0] !== 0 || data.centroid[1] !== 0)
  const initialCenter: [number, number] = centroidValid
    ? (data!.centroid as [number, number])
    : FALLBACK_CENTER

  return (
    <div className='relative w-full h-full'>
      <BaseMap initialCenter={initialCenter} initialZoom={5.2} edgeFade={{ all: 20 }}>
        <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
        <TunnelMarkerLayer
          locations={Array.isArray(data?.locations) ? data.locations : []}
          centroid={data?.centroid ?? null}
          isReady={isSuccess}
        />
      </BaseMap>

      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg'>
          <div className='flex flex-col items-center gap-2'>
            <div className='w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin' />
            <span className='text-yellow-400 text-xs'>กำลังโหลด...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo<Props>(MapTunnel)
