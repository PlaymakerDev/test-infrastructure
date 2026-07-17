"use client"
import { useEffect, useRef } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
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
  /** Show the Thai-highway-sign label ("road_code", yellow text on blue
   *  rectangle) on every DRR road. Default `true`. Set false to opt a
   *  specific map out (e.g. very small preview maps where labels would
   *  clutter). */
  showLabels?: boolean
  /** Zoom at which labels start appearing. Default `10.5` — below this
   *  the whole road network is visible and labels would overlap heavily. */
  labelMinZoom?: number
}

const SOURCE_ID = 'drr-roads'
const LAYER_ID = 'drr-roads-line'
const LABEL_LAYER_ID = 'drr-roads-label'
const SIGN_IMAGE_ID = 'drr-road-sign-bg'

// 9-slice SVG "shield" background — a navy blue rounded rectangle with a
// yellow border. Registered with `stretchX`/`stretchY` so `icon-text-fit`
// stretches only the middle strip; the corners stay crisp for any road-code
// length. Colour tuned to the Thai ทช. sign — see reference photo the user
// supplied (yellow border, dark navy fill).
const SIGN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="4" ry="4" fill="#003F87" stroke="#FCD116" stroke-width="1.5"/>
</svg>`

/** Register the road-sign background image on the map (idempotent).
 *  Resolves true when the image is registered (or already was); false if the
 *  browser failed to decode the SVG — in that case the caller can still add
 *  the label layer without the icon and fall back to a text-only halo. */
function registerSignImage(map: MapboxMap): Promise<boolean> {
  if (map.hasImage(SIGN_IMAGE_ID)) return Promise.resolve(true)
  return new Promise((resolve) => {
    const img = new Image(32, 32)
    img.onload = () => {
      if (!map.hasImage(SIGN_IMAGE_ID)) {
        // pixelRatio 2 = the source SVG is 2×; final on-screen size is
        // driven by icon-text-fit stretching around the text glyph run.
        map.addImage(SIGN_IMAGE_ID, img, {
          pixelRatio: 2,
          // 9-slice: the middle strip (x/y from 8 to 24) stretches to fit
          // the text. The corners (0–8 and 24–32) never distort. `content`
          // tells Mapbox where the text glyphs should sit inside the image.
          stretchX: [[8, 24]],
          stretchY: [[8, 24]],
          content: [5, 5, 27, 27],
        })
      }
      resolve(true)
    }
    img.onerror = () => resolve(false)
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(SIGN_SVG)}`
  })
}

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
  showLabels = true,
  labelMinZoom = 10.5,
}) => {
  const { map, isLoaded } = useMap()
  const setupRef = useRef(false)

  useEffect(() => {
    if (!map || !isLoaded || setupRef.current) return
    setupRef.current = true
    let cancelled = false

    const run = async () => {
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

        // Road-code labels — Thai-highway-sign style (yellow "road_code" on a
        // navy blue rounded shield). Uses the tileset's own `road_code` field,
        // so no Mapbox Studio changes are required to add these. Waits for the
        // shield background image to register before adding the layer.
        if (showLabels && !cancelled) {
          const iconReady = await registerSignImage(map)
          if (cancelled) return
          if (!map.getLayer(LABEL_LAYER_ID)) {
            map.addLayer({
              id: LABEL_LAYER_ID,
              type: 'symbol',
              source: SOURCE_ID,
              'source-layer': sourceLayer,
              minzoom: labelMinZoom,
              layout: {
                'text-field': ['get', 'road_code'],
                'text-font': ['Arial Unicode MS Bold'],
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  labelMinZoom, 9,
                  14, 12,
                ],
                'text-letter-spacing': 0.02,
                // 1 label per line feature, at the line's centre-point. Text
                // rotation kept as `viewport` so labels are always upright
                // (Thai signs don't rotate with the road direction).
                'symbol-placement': 'line-center',
                'text-rotation-alignment': 'viewport',
                'text-allow-overlap': false,
                'text-padding': 6,
                ...(iconReady
                  ? {
                      'icon-image': SIGN_IMAGE_ID,
                      'icon-text-fit': 'both',
                      // padding [top, right, bottom, left] around the text —
                      // tuned so the shield hugs the code without cutting it.
                      'icon-text-fit-padding': [2, 5, 2, 5],
                      'icon-rotation-alignment': 'viewport',
                      'icon-allow-overlap': false,
                    }
                  : {}),
              },
              paint: {
                'text-color': '#FCD116',
                // Fallback: if the icon failed to register, a thick navy halo
                // still gives the yellow-on-blue read.
                ...(iconReady
                  ? {}
                  : { 'text-halo-color': '#003F87', 'text-halo-width': 3, 'text-halo-blur': 0.5 }),
              },
            })
          }
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
    }

    run()

    return () => {
      cancelled = true
      try {
        if (map.getLayer(LABEL_LAYER_ID)) map.removeLayer(LABEL_LAYER_ID)
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
        // Image is intentionally NOT removed — it's cheap to keep, shared
        // across every map instance, and removing it during a fast unmount/
        // remount would race with the next mount's `addImage`.
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
