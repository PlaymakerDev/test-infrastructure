"use client"
import { useEffect, useMemo } from 'react'
import type { GeoJSONSource, LineLayerSpecification } from 'mapbox-gl'
import { useMap } from '@/components/map/hooks/useMap'

interface Props {
  /** [lat, lng] pairs as returned by the backend (confirmed against a real
   *  Laem Chabang route: `[13.02, 101.07]` is only valid as [lat, lng] for
   *  that location) — NOT Mapbox/GeoJSON's [lng, lat] order. */
  positions?: number[][]
}

const SOURCE_ID = 'gps-route-line-src'
const LAYER_ID = 'gps-route-line-layer'

/** Draws the selected route as a line and fits the map to it. Renders
 *  nothing itself — must be mounted inside a `BaseMap`. */
const RouteLineLayer: React.FC<Props> = ({ positions }) => {
  const { map, isLoaded } = useMap()

  const coordinates = useMemo<[number, number][]>(() => {
    return (positions ?? [])
      .filter((p): p is [number, number] =>
        Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .map(([lat, lng]) => [lng, lat])
  }, [positions])

  useEffect(() => {
    // A LineString needs at least 2 points — skip entirely rather than ever
    // creating the source/layer with an empty/1-point geometry.
    if (!map || !isLoaded || coordinates.length < 2) return

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates },
    }

    const existingSource = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (existingSource) {
      existingSource.setData(geojson)
    } else {
      map.addSource(SOURCE_ID, { type: 'geojson', data: geojson })
      const layerSpec: LineLayerSpecification = {
        id: LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#FCD116',
          'line-width': 4,
          'line-opacity': 0.9,
        },
      }
      map.addLayer(layerSpec)
    }

    const lngs = coordinates.map((c) => c[0])
    const lats = coordinates.map((c) => c[1])
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 60, duration: 800 }
    )
  }, [map, isLoaded, coordinates])

  // Cleanup only on unmount / map-instance change — not on every route swap
  // (route swaps are handled above via `setData`, not remove+re-add).
  useEffect(() => {
    return () => {
      if (!map) return
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // Map already torn down — ignore
      }
    }
  }, [map])

  return null
}

export default RouteLineLayer
