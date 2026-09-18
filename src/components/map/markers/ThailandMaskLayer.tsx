"use client"
import { useEffect, useRef } from 'react'
import { useMap } from '../hooks/useMap'
import { loadGeoJsonOnce } from '../hooks/geojsonCache'

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

  // Skip the 1.5MB province geojson for maps that can't show it — without
  // either prop the province layers stay invisible and unclickable forever.
  // `!== undefined`, not truthy: ReactMap passes `null` while nothing is
  // highlighted and still needs the layers ready. Setup runs once per map, so
  // this must be declared at mount (pass `null`, never `undefined`).
  const needProvinces = enableProvinceClick || highlightedProvinceCode !== undefined

  // Warm the cache the moment this mounts instead of waiting for the style to
  // finish: the fetch is what the mask waits on, and starting it only after
  // `load` is what left the whole region visible for a beat.
  useEffect(() => {
    loadGeoJsonOnce(thailandUrl).catch(() => {})
    if (needProvinces) loadGeoJsonOnce(provincesUrl).catch(() => {})
  }, [thailandUrl, provincesUrl, needProvinces])

  useEffect(() => {
    if (!map || setupRef.current) return
    setupRef.current = true
    let cancelled = false
    let started = false

    const run = async () => {
      if (started || cancelled) return
      started = true
      try {
        // Start both now, but only WAIT for the country outline. The provinces
        // file is 1.5MB — awaiting it together held the crop back until it
        // landed, which is the whole region showing un-cropped for a beat.
        const provincesPromise = needProvinces
          ? loadGeoJsonOnce<GeoJSON.FeatureCollection>(provincesUrl)
          : Promise.resolve(null)
        provincesPromise.catch(() => {})

        const worldRing: GeoJSON.Position[] = [
          [-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85],
        ]
        const maskOf = (holes: GeoJSON.Position[][]) => ({
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'Polygon' as const, coordinates: [worldRing, ...holes] },
        })

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

        // Cover the whole world FIRST, before the outline has even arrived, and
        // punch Thailand out of it once it does. Mapbox paints this from its
        // very first frame, so there is no instant where the basemap is on
        // screen un-cropped — no matter how the fetch and React renders race.
        if (!map.getSource('thailand-mask')) {
          map.addSource('thailand-mask', { type: 'geojson', data: maskOf([]) })
          map.addLayer(
            {
              id: 'thailand-mask-fill',
              type: 'fill',
              source: 'thailand-mask',
              // Opaque while it covers everything; drops to maskOpacity once
              // Thailand is cut out and the neighbours should show through.
              paint: { 'fill-color': maskColor, 'fill-opacity': 1 },
            },
            beforeId
          )
        }

        const thailandData =
          await loadGeoJsonOnce<GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>>(thailandUrl)
        if (cancelled || !map) return

        const tGeom = thailandData.features[0].geometry
        const tHoles: GeoJSON.Position[][] =
          tGeom.type === 'Polygon'
            ? [tGeom.coordinates[0]]
            : tGeom.coordinates.map((p) => p[0])

        const src = map.getSource('thailand-mask') as { setData?: (d: unknown) => void } | undefined
        src?.setData?.(maskOf(tHoles))
        map.setPaintProperty('thailand-mask-fill', 'fill-opacity', maskOpacity)


        const provincesData = await provincesPromise
        if (cancelled || !map) return

        // Order unchanged for consumers that do use provinces.
        if (provincesData && !map.getSource('th-provinces')) {
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
        // Never strand the map under the opaque world fill.
        try {
          if (map?.getLayer('thailand-mask-fill')) map.removeLayer('thailand-mask-fill')
          if (map?.getSource('thailand-mask')) map.removeSource('thailand-mask')
        } catch {
          // map already torn down
        }
      }
    }

    // Start on `style.load`, NOT on the map's `load` — `load` also waits for
    // the first tile batch, so gating on it meant the crop could only go up
    // after the basemap had already drawn. Adding layers needs the style and
    // nothing more. `load` stays as a fallback in case `style.load` was
    // already missed.
    if (map.isStyleLoaded()) run()
    else {
      map.once('style.load', run)
      map.once('load', run)
    }

    return () => {
      cancelled = true
      map.off('style.load', run)
      map.off('load', run)
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
  }, [map])

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

  // Nothing to render: the crop is a mapbox layer that goes up before the
  // first tile paints, so there is no un-cropped moment for a DOM cover to
  // hide — and hiding the map while the rest loads only traded a short
  // sequence of arrivals for a long blank screen.
  return null
}

export default ThailandMaskLayer
