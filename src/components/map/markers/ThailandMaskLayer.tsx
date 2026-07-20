"use client"
import { useEffect, useRef } from 'react'
import { useMap } from '../hooks/useMap'

export interface ThailandMaskLayerProps {
  /** URL of the country outline (single feature, Polygon or MultiPolygon) */
  thailandUrl?: string
  /** URL of provinces (FeatureCollection with `code` property) */
  provincesUrl?: string
  /** Province `code` to highlight in yellow + dim others (null/undefined = no highlight) */
  highlightedProvinceCode?: string | null
  /** Mask fill color (outside Thailand) */
  maskColor?: string
  maskOpacity?: number
  /** Highlighted province line color */
  highlightColor?: string
  /** When true, adds an invisible full-coverage fill on every province that
   *  fires mouse events (click / mouseenter / mouseleave) on the layer id
   *  `province-click-hitbox`. Callers attach their own handlers (see the
   *  dashboard). Default `false` — every non-dashboard map opts out so it
   *  can't accidentally intercept clicks meant for markers underneath. */
  enableProvinceClick?: boolean
}

/** Layer id of the transparent province-click hitbox layer. Exported so the
 *  dashboard's click-handler code can attach `map.on('click', id, ...)`
 *  without hard-coding the string. */
export const PROVINCE_CLICK_LAYER_ID = 'province-click-hitbox'

/** Hover-affordance layers (dashboard only, added with `enableProvinceClick`):
 *  a soft yellow fill + outline on the province under the cursor, driven by
 *  `map.setFilter(id, ['==', ['get','code'], code])` from the hover handler.
 *  Start filtered to a non-existent code so nothing shows until hovered. */
export const PROVINCE_HOVER_FILL_ID = 'province-hover-fill'
export const PROVINCE_HOVER_LINE_ID = 'province-hover-line'

/**
 * Renders a Thailand-shaped country mask + (optional) per-province highlight outline.
 *
 * Drives 3 mapbox layers:
 *   - `thailand-mask-fill`         — dark fill outside Thailand
 *   - `province-dim-fill`          — dark fill on every province EXCEPT the highlighted one
 *   - `province-highlight-line`    — yellow outline on the highlighted province
 *
 * Province dim/highlight is hidden until `highlightedProvinceCode` is provided.
 */
const ThailandMaskLayer: React.FC<ThailandMaskLayerProps> = ({
  // Mapbox fetches these itself (no Next auto-prefix) — carry the deploy
  // basePath ('/atlas' in prod, '' in dev) explicitly so BOTH environments
  // resolve public/data correctly.
  thailandUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/thailand.geojson`,
  provincesUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/th-provinces.geojson`,
  highlightedProvinceCode,
  maskColor = '#0E0D0D',
  maskOpacity = 0.8,
  highlightColor = '#FCD116',
  enableProvinceClick = false,
}) => {
  const { map, isLoaded } = useMap()
  const setupRef = useRef(false)

  useEffect(() => {
    if (!map || !isLoaded || setupRef.current) return
    setupRef.current = true
    let cancelled = false

    const run = async () => {
      try {
        const [thailandData, provincesData] = await Promise.all([
          fetch(thailandUrl).then((r) => r.json()),
          fetch(provincesUrl).then((r) => r.json()),
        ])
        if (cancelled || !map) return

        const tGeom = thailandData.features[0].geometry
        const worldRing: [number, number][] = [
          [-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85],
        ]
        const tHoles: [number, number][][] =
          tGeom.type === 'Polygon'
            ? [tGeom.coordinates[0]]
            : tGeom.coordinates.map((p: [number, number][][]) => p[0])

        const maskFeature = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [worldRing, ...tHoles],
          },
        }

        // Choose the beforeId so the mask/highlight layers ALWAYS render below
        // markers. When this component's async fetch resolves AFTER the marker
        // layers have already been added (typical since markers are sync but
        // this fetches two geojsons), `firstSymbol` alone doesn't help — those
        // marker symbols are ABOVE the base style's first symbol. Prefer the
        // first `markerlayer-*` id so the mask sits underneath them; fall back
        // to `firstSymbol` when no marker layer has mounted yet.
        const style = map.getStyle()
        const firstMarkerLayer = style?.layers?.find((l) => l.id.startsWith('markerlayer-'))?.id
        const firstSymbol = style?.layers?.find((l) => l.type === 'symbol')?.id
        const beforeId = firstMarkerLayer ?? firstSymbol

        if (!map.getSource('thailand-mask')) {
          map.addSource('thailand-mask', { type: 'geojson', data: maskFeature })
          map.addLayer(
            {
              id: 'thailand-mask-fill',
              type: 'fill',
              source: 'thailand-mask',
              paint: { 'fill-color': maskColor, 'fill-opacity': maskOpacity },
            },
            beforeId
          )
        }

        if (!map.getSource('th-provinces')) {
          map.addSource('th-provinces', { type: 'geojson', data: provincesData })
          map.addLayer(
            {
              id: 'province-dim-fill',
              type: 'fill',
              source: 'th-provinces',
              layout: { visibility: 'none' },
              filter: ['!=', ['get', 'code'], '__none__'],
              paint: { 'fill-color': '#000000', 'fill-opacity': 0.45 },
            },
            beforeId
          )
          map.addLayer(
            {
              id: 'province-highlight-line',
              type: 'line',
              source: 'th-provinces',
              layout: { visibility: 'none', 'line-join': 'round' },
              filter: ['==', ['get', 'code'], '__none__'],
              paint: {
                'line-color': highlightColor,
                'line-width': 2,
                'line-opacity': 0.8,
              },
            },
            beforeId
          )

          // Optional click-hitbox layer — always visible with alpha ~0 so it
          // never repaints anything visible, but mapbox still fires click /
          // mouseenter / mouseleave events on it. Added LAST (on top of the
          // dim + highlight layers) so it always wins the click above the
          // dimmed non-highlighted provinces, while staying BELOW every
          // marker layer via the same `beforeId`. Only added when opted-in
          // (dashboard) — every other map opts out so clicks pass through
          // to their own markers unchanged.
          if (enableProvinceClick && !map.getLayer(PROVINCE_CLICK_LAYER_ID)) {
            // Hover affordance — fill + outline on the hovered province so the
            // user can tell WHICH province they're about to click. Both start
            // with a never-matching filter; the dashboard's mousemove handler
            // retargets them via setFilter.
            map.addLayer(
              {
                id: PROVINCE_HOVER_FILL_ID,
                type: 'fill',
                source: 'th-provinces',
                filter: ['==', ['get', 'code'], '__none__'],
                paint: { 'fill-color': highlightColor, 'fill-opacity': 0.12 },
              },
              beforeId
            )
            map.addLayer(
              {
                id: PROVINCE_HOVER_LINE_ID,
                type: 'line',
                source: 'th-provinces',
                filter: ['==', ['get', 'code'], '__none__'],
                layout: { 'line-join': 'round' },
                paint: {
                  'line-color': highlightColor,
                  'line-width': 2.5,
                  'line-opacity': 0.95,
                },
              },
              beforeId
            )
            map.addLayer(
              {
                id: PROVINCE_CLICK_LAYER_ID,
                type: 'fill',
                source: 'th-provinces',
                paint: {
                  // 0.001, not 0 — some mapbox versions skip event dispatch
                  // for fully-transparent fills. Effectively invisible.
                  'fill-color': '#000000',
                  'fill-opacity': 0.001,
                },
              },
              beforeId
            )
          }
        }
      } catch (e) {
        console.error('[ThailandMaskLayer] failed to load geojson', e)
      }
    }

    run()

    return () => {
      cancelled = true
      try {
        for (const id of [PROVINCE_CLICK_LAYER_ID, PROVINCE_HOVER_LINE_ID, PROVINCE_HOVER_FILL_ID, 'province-highlight-line', 'province-dim-fill', 'thailand-mask-fill']) {
          if (map.getLayer(id)) map.removeLayer(id)
        }
        for (const id of ['th-provinces', 'thailand-mask']) {
          if (map.getSource(id)) map.removeSource(id)
        }
      } catch {
        // map already torn down
      }
      setupRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded])

  // React to highlight changes
  useEffect(() => {
    if (!map || !isLoaded) return
    if (!map.getLayer('province-dim-fill') || !map.getLayer('province-highlight-line')) return

    if (highlightedProvinceCode) {
      map.setLayoutProperty('province-dim-fill', 'visibility', 'visible')
      map.setLayoutProperty('province-highlight-line', 'visibility', 'visible')
      map.setFilter('province-dim-fill', ['!=', ['get', 'code'], highlightedProvinceCode])
      map.setFilter('province-highlight-line', ['==', ['get', 'code'], highlightedProvinceCode])
    } else {
      map.setLayoutProperty('province-dim-fill', 'visibility', 'none')
      map.setLayoutProperty('province-highlight-line', 'visibility', 'none')
    }
  }, [map, isLoaded, highlightedProvinceCode])

  return null
}

export default ThailandMaskLayer
