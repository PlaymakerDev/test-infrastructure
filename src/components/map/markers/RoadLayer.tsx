"use client"
import { useEffect, useRef } from 'react'
import { useMap } from '../hooks/useMap'

export interface RoadLayerProps {
  /** `mapbox://` vector tileset URL (uploaded to Mapbox Studio / Data Workbench) */
  tilesetUrl?: string
  /** source-layer name inside the tileset */
  sourceLayer?: string
  /** base road colour (used when a road has no live status) */
  color?: string
  /** base line width at mid zoom (scaled by the zoom interpolation) */
  width?: number
  /** live status per road: `road_code` → status key (drives feature-state colour) */
  statusByRoad?: Record<string, string>
  /** status key → colour */
  statusColors?: Record<string, string>
  /** grey out the Mapbox Standard base-map roads so the DRR roads stand out */
  muteBaseRoads?: boolean
  /** colour applied to the base-map roads when muted */
  baseRoadColor?: string
}

const SOURCE_ID = 'drr-roads'
const LAYER_ID = 'drr-roads-line'

/**
 * Draws all DRR road centrelines from a Mapbox vector tileset.
 *
 * Uses `promoteId: road_code` so live status can be applied per road via
 * `setFeatureState({ color })` — no need to re-send geometry. Mirrors the
 * add-source / add-layer / cleanup pattern of ThailandMaskLayer.
 */
const RoadLayer: React.FC<RoadLayerProps> = ({
  tilesetUrl = 'mapbox://brender99.o3krkklpk9f6',
  sourceLayer = 'a44b935b4d43c7ce8a14',
  color = '#FCD116',
  width = 1.6,
  statusByRoad,
  statusColors = { online: '#22c55e', offline: '#ef4444', warning: '#f59e0b' },
  muteBaseRoads = true,
  baseRoadColor = '#707070',
}) => {
  const { map, isLoaded } = useMap()
  const setupRef = useRef(false)

  useEffect(() => {
    if (!map || !isLoaded || setupRef.current) return
    setupRef.current = true
    try {
      const firstSymbol = map.getStyle()?.layers?.find((l) => l.type === 'symbol')?.id

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'vector',
          url: tilesetUrl,
          promoteId: { [sourceLayer]: 'road_code' },
        })
      }

      if (!map.getLayer(LAYER_ID)) {
        map.addLayer(
          {
            id: LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            'source-layer': sourceLayer,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              // live status colour (feature-state) wins; else the base colour
              'line-color': ['coalesce', ['feature-state', 'color'], color],
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                6, 0.5,
                10, width,
                14, width * 2.5,
              ],
              'line-opacity': 0.9,
            },
          },
          firstSymbol
        )
      }

      // The base-map roads come from the imported Mapbox Standard "basemap" and
      // are themed via config properties (not per-layer paint). Grey them so the
      // yellow DRR roads read as the primary network.
      const stdMap = map as unknown as {
        setConfigProperty?: (importId: string, name: string, value: unknown) => void
      }
      if (muteBaseRoads && typeof stdMap.setConfigProperty === 'function') {
        for (const key of ['colorRoads', 'colorMotorways', 'colorTrunks']) {
          try {
            stdMap.setConfigProperty('basemap', key, baseRoadColor)
          } catch {
            // config key not supported by this style
          }
        }
      }
    } catch (e) {
      console.error('[RoadLayer] failed to add road source/layer', e)
    }

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // map already torn down
      }
      setupRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded])

  // Apply live status colours via feature-state (id = road_code via promoteId).
  useEffect(() => {
    if (!map || !isLoaded || !statusByRoad) return
    if (!map.getSource(SOURCE_ID)) return
    for (const [roadCode, status] of Object.entries(statusByRoad)) {
      const c = statusColors[status]
      if (!c) continue
      try {
        map.setFeatureState({ source: SOURCE_ID, sourceLayer, id: roadCode }, { color: c })
      } catch {
        // source not ready yet
      }
    }
  }, [map, isLoaded, statusByRoad, statusColors, sourceLayer])

  return null
}

export default RoadLayer
