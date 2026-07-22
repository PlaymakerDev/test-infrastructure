"use client"
import React, { useEffect } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { WhiteTeardropPin, OFFLINE_PIN_COLOR } from '@/components/map/markers/OverlapMarkers'
import { useMap } from '@/components/map/hooks/useMap'
import { useDetailContext } from '../../../context'
import type { TrafficSignalProject } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

interface Props {
  /** Optional vignette overlay forwarded to BaseMap. */
  edgeFade?: MapEdgeFadeProps
}

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

const isValidCoord = (c: [number, number]): boolean =>
  c[0] !== 0 || c[1] !== 0

/** Popup card shown when the user clicks the detail-page marker. Mirrors the
 *  popup design used on the overall map (VMS-style dark card with a colored
 *  border + status indicator) so both pages share visual language. */
const DetailSignalPopup: React.FC<{ project: TrafficSignalProject }> = ({
  project,
}) => {
  const isOnline = project.connection === 'online'
  return (
    <div
      className={`min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)] ${isOnline ? 'border-cyan-400' : 'border-red-500'
        }`}
    >
      <p
        className={`fs-12 font-bold tracking-wide ${isOnline ? 'text-cyan-400' : 'text-red-400'
          }`}
      >
        Traffic Signal · {project.roadCode}
      </p>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
        {project.installPoint}
      </p>
      <p
        className={`fs-12 font-semibold mt-1.5 ${isOnline ? 'text-emerald-400' : 'text-red-400'
          }`}
      >
        ● {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
      </p>
      <p className='fs-12 text-slate-500 mt-0.5'>
        PCU: {Number(project.dailyPCU ?? 0).toLocaleString()} · Phase: {project.phase}
      </p>
    </div>
  )
}

// ── Live traffic congestion lines (Google-Maps-style colored roads) ─────────
// Mapbox's own real-time traffic tileset — NO backend API needed. Colors by
// the `congestion` property: low → green, moderate → amber, heavy → orange,
// severe → red. Scoped to THIS detail map only (per 2026-07-22 request);
// data source is Mapbox traffic (crowdsourced), not the department's counters.
const TRAFFIC_SOURCE_ID = 'mapbox-traffic'
const TRAFFIC_LAYER_ID = 'traffic-congestion-lines'

const TrafficCongestionLayer: React.FC = () => {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return
    if (map.getSource(TRAFFIC_SOURCE_ID)) return

    map.addSource(TRAFFIC_SOURCE_ID, {
      type: 'vector',
      // Tileset id needs the `mapbox.` account prefix — without it the
      // TileJSON request 404s and no lines render.
      url: 'mapbox://mapbox.mapbox-traffic-v1',
    })
    // Slot the lines under the first symbol layer so road names/shields stay
    // readable above the colored traffic.
    const firstSymbol = map.getStyle()?.layers?.find((l) => l.type === 'symbol')?.id
    map.addLayer(
      {
        id: TRAFFIC_LAYER_ID,
        type: 'line',
        source: TRAFFIC_SOURCE_ID,
        'source-layer': 'traffic',
        // Scoped to the intersection view (per 2026-07-22 request):
        //  • minzoom 15 — the page lands at z17 on the marker; zooming out
        //    past the neighborhood makes the lines vanish instead of painting
        //    the whole map. (A `within`-circle filter was tried first but
        //    traffic features span kilometres, so segments crossing the
        //    circle edge — including the main road THROUGH the junction —
        //    dropped out entirely.)
        //  • class filter — main roads only; residential sois stay uncolored
        //    so the junction's approach roads stand out.
        minzoom: 15,
        filter: [
          'match',
          ['get', 'class'],
          ['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'secondary', 'tertiary'],
          true,
          false,
        ],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'match',
            ['get', 'congestion'],
            'low', '#3BD16F',
            'moderate', '#FFB930',
            'heavy', '#FF7A45',
            'severe', '#E93A3A',
            /* unknown */ '#3BD16F',
          ],
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 15, 2.5, 18, 7],
          // Fade in as the user reaches street level — no hard pop at minzoom.
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0, 16, 0.9],
        },
      },
      firstSymbol,
    )

    return () => {
      if (!map.style) return
      if (map.getLayer(TRAFFIC_LAYER_ID)) map.removeLayer(TRAFFIC_LAYER_ID)
      if (map.getSource(TRAFFIC_SOURCE_ID)) map.removeSource(TRAFFIC_SOURCE_ID)
    }
  }, [map, isLoaded])

  return null
}

/** Color chip + label row for the traffic legend. */
const LegendChip: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className='inline-flex items-center gap-1.5'>
    <span className='inline-block w-4 h-1.5 rounded-full' style={{ background: color }} />
    <span className='fs-12 text-white/85'>{label}</span>
  </span>
)

/** Inner component — runs inside MapContext so it can flyTo when coord
 *  arrives from the overview API (which may load after first paint). */
const SignalMarker: React.FC<{ project: TrafficSignalProject }> = ({ project }) => {
  const { map, isLoaded } = useMap()
  const coord = project.coord

  useEffect(() => {
    if (!map || !isLoaded || !isValidCoord(coord)) return
    map.flyTo({ center: coord, zoom: 17, duration: 1000 })
  }, [map, isLoaded, coord])

  if (!isValidCoord(coord)) return null

  return (
    <HTMLMarker
      lngLat={coord}
      anchor='bottom'
      title={project.installPoint}
      popup={() => <DetailSignalPopup project={project} />}
      popupOptions={{ offset: 18, closeButton: false }}
    >
      {/* Single device at this pin — offline paints it red (all-offline rule). */}
      <WhiteTeardropPin
        color={project.connection === 'online' ? undefined : OFFLINE_PIN_COLOR}
      />
    </HTMLMarker>
  )
}

/** Single-intersection map used as the Tab1 background.
 *  Higher zoom + pitch so the intersection fills the viewport like Figma. */
const MapDetailTrafficSignal: React.FC<Props> = ({ edgeFade }) => {
  const { project } = useDetailContext()
  // Map can mount before the overview endpoint returns coords. Use a sane
  // Thailand-area fallback so we never initialize on [0, 0] (Atlantic).
  const initialCenter = isValidCoord(project.coord) ? project.coord : FALLBACK_CENTER

  return (
    <div className='relative w-full h-full'>
      <BaseMap
        initialCenter={initialCenter}
        initialZoom={isValidCoord(project.coord) ? 17 : 5.5}
        initialPitch={55}
        edgeFade={edgeFade}
      >
        <TrafficCongestionLayer />
        <SignalMarker project={project} />
      </BaseMap>
      {/* Traffic legend — top-left: the map wrapper is taller than the
          viewport (bottom corners scroll out of sight) and the right side +
          bottom belong to the stat/Cycle-Length overlays. */}
      <div
        className='absolute top-4 left-4 z-10 rounded-lg px-3 py-2 pointer-events-none'
        style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
      >
        <p className='fs-12 text-white/60 mb-1'>สภาพจราจร</p>
        <div className='flex items-center gap-3'>
          <LegendChip color='#3BD16F' label='คล่องตัว' />
          <LegendChip color='#FFB930' label='ชะลอตัว' />
          <LegendChip color='#FF7A45' label='หนาแน่น' />
          <LegendChip color='#E93A3A' label='ติดขัด' />
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(MapDetailTrafficSignal)
