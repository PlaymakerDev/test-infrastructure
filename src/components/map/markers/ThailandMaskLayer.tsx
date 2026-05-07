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
}

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
  thailandUrl = '/data/thailand.geojson',
  provincesUrl = '/data/th-provinces.geojson',
  highlightedProvinceCode,
  maskColor = '#0E0D0D',
  maskOpacity = 0.8,
  highlightColor = '#FCD116',
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

        const firstSymbol = map.getStyle()?.layers?.find((l) => l.type === 'symbol')?.id

        if (!map.getSource('thailand-mask')) {
          map.addSource('thailand-mask', { type: 'geojson', data: maskFeature })
          map.addLayer(
            {
              id: 'thailand-mask-fill',
              type: 'fill',
              source: 'thailand-mask',
              paint: { 'fill-color': maskColor, 'fill-opacity': maskOpacity },
            },
            firstSymbol
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
            firstSymbol
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
            firstSymbol
          )
        }
      } catch (e) {
        console.error('[ThailandMaskLayer] failed to load geojson', e)
      }
    }

    run()

    return () => {
      cancelled = true
      try {
        for (const id of ['province-highlight-line', 'province-dim-fill', 'thailand-mask-fill']) {
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
