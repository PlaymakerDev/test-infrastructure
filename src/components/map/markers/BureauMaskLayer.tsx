"use client"
import { useEffect, useRef } from 'react'
import { useMap } from '../hooks/useMap'
import { useBureauFeatures } from '../hooks/useBureauFeatures'

export interface BureauMaskLayerProps {
  /** Zoom AT OR ABOVE this value hides the bureau outlines — the base
   *  ThailandMaskLayer's province layer takes over at that point. Default
   *  matches `PROVINCE_ZOOM_THRESHOLD` in ReactMap so the two layers hand
   *  off cleanly (never both visible). */
  hideAtZoom?: number
  /** Highlight one bureau (by stch id). null/undefined = no highlight. */
  highlightedStch?: number | null
  /** Fill/stroke tuning. */
  fillColor?: string
  fillOpacity?: number
  lineColor?: string
  lineWidth?: number
  hoverColor?: string
  /** When true, register a soft mouse-hover affordance + emit clicks via
   *  the exported layer id so ReactMap can wire flyTo → bureau bbox.
   *  Default `true` for the dashboard map; other maps can opt out. */
  enableClick?: boolean
}

/** Mapbox layer ids — exported so ReactMap can attach click handlers by
 *  the same names it uses for the province layer. */
export const BUREAU_CLICK_LAYER_ID = 'bureau-click-hitbox'
export const BUREAU_FILL_ID = 'bureau-fill'
export const BUREAU_LINE_ID = 'bureau-line'
export const BUREAU_HOVER_FILL_ID = 'bureau-hover-fill'
export const BUREAU_HOVER_LINE_ID = 'bureau-hover-line'

const SOURCE_ID = 'bureaus-src'

/** Renders 18 สำนัก polygons — visible at country zoom, hidden once the
 *  user drills into province level. Handoff is instant (no animation) so
 *  the province + bureau layers never overlap. */
const BureauMaskLayer: React.FC<BureauMaskLayerProps> = ({
  hideAtZoom = 6.5,
  highlightedStch,
  // Country-zoom fill: very faint tint so the bureau reads as a subtle group
  // rather than a hard block. The dashed cyan line does the heavy lifting.
  fillColor = '#22D3EE',
  fillOpacity = 0.04,
  // Permanent outline: bright cyan #22D3EE — clearly different from the
  // yellow province highlight. Cyan = "สำนัก grouping (parent scope)",
  // yellow = "จังหวัด / drill-down target". Distinct color families so
  // the two never read as the same layer.
  lineColor = '#22D3EE',
  lineWidth = 2.6,
  // Bureau hover keeps the cyan family — the same boundary lit up bolder,
  // so hovering a จังหวัด makes its parent สำนัก glow in the SAME hue as
  // the always-on outline (no yellow wash across multiple provinces).
  hoverColor = '#67E8F9',
  enableClick = true,
}) => {
  const { map, isLoaded } = useMap()
  const features = useBureauFeatures()
  const setupRef = useRef(false)

  // Register source + all four layers exactly once per map lifetime.
  useEffect(() => {
    if (!map || !isLoaded || !features || setupRef.current) return
    setupRef.current = true

    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: features.map((b) => b.feature),
    }
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: fc,
        promoteId: 'stch',
      })
    }

    // Fill — visible only below hideAtZoom.
    if (!map.getLayer(BUREAU_FILL_ID)) {
      map.addLayer({
        id: BUREAU_FILL_ID,
        type: 'fill',
        source: SOURCE_ID,
        maxzoom: hideAtZoom,
        paint: {
          'fill-color': fillColor,
          'fill-opacity': fillOpacity,
        },
      })
    }
    // Outline — visible at EVERY zoom level so users always see the parent
    // สำนัก boundary around the province they're looking at. Dashed so it
    // never reads as a จังหวัด outline (province highlight is solid yellow).
    // Only fill + hover-fill respect `hideAtZoom`; the outline provides
    // constant orientation.
    if (!map.getLayer(BUREAU_LINE_ID)) {
      map.addLayer({
        id: BUREAU_LINE_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': lineColor,
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            5, lineWidth,
            9, lineWidth * 0.65,
            12, lineWidth * 0.45,
          ],
          'line-opacity': [
            'interpolate', ['linear'], ['zoom'],
            5, 0.9,
            8, 0.7,
            12, 0.45,
          ],
          'line-dasharray': [3, 2],
        },
      })
    }
    // Hover — starts filtered to a non-existent stch so nothing shows until
    // the parent updates the filter on mousemove.
    if (!map.getLayer(BUREAU_HOVER_FILL_ID)) {
      map.addLayer({
        id: BUREAU_HOVER_FILL_ID,
        type: 'fill',
        source: SOURCE_ID,
        maxzoom: hideAtZoom,
        filter: ['==', ['get', 'stch'], -1],
        paint: {
          'fill-color': hoverColor,
          'fill-opacity': 0.18,
        },
      })
    }
    // Bureau hover-line is visible at ALL zooms (below HOVER_MAX_ZOOM — the
    // ReactMap parent gates it) — it's what lights up the parent สำนัก when
    // the user hovers a province. Solid + bright cyan so it reads as the
    // SAME layer as the always-on dashed outline, just "lit up" — never
    // yellow, so it can never be mistaken for a จังหวัด highlight.
    if (!map.getLayer(BUREAU_HOVER_LINE_ID)) {
      map.addLayer({
        id: BUREAU_HOVER_LINE_ID,
        type: 'line',
        source: SOURCE_ID,
        filter: ['==', ['get', 'stch'], -1],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': hoverColor,
          'line-width': 4,
          'line-opacity': 1,
        },
      })
    }
    // Full-coverage transparent hitbox — same layer contract as
    // ThailandMaskLayer's province click layer. Emits clicks/mousemove via
    // the exported id so the dashboard hooks in from one place.
    if (enableClick && !map.getLayer(BUREAU_CLICK_LAYER_ID)) {
      map.addLayer({
        id: BUREAU_CLICK_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        maxzoom: hideAtZoom,
        paint: {
          'fill-color': '#000',
          'fill-opacity': 0,
        },
      })
    }
  }, [map, isLoaded, features, hideAtZoom, fillColor, fillOpacity, lineColor, lineWidth, hoverColor, enableClick])

  // Highlight sync — always safe to run (setFilter no-ops on missing layer).
  useEffect(() => {
    if (!map) return
    const filter = highlightedStch != null
      ? ['==', ['get', 'stch'], highlightedStch] as unknown as Parameters<typeof map.setFilter>[1]
      : ['==', ['get', 'stch'], -1] as unknown as Parameters<typeof map.setFilter>[1]
    if (map.getLayer(BUREAU_HOVER_FILL_ID)) map.setFilter(BUREAU_HOVER_FILL_ID, filter)
    if (map.getLayer(BUREAU_HOVER_LINE_ID)) map.setFilter(BUREAU_HOVER_LINE_ID, filter)
  }, [map, highlightedStch])

  return null
}

export default BureauMaskLayer
