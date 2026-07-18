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
    <BaseMap
      initialCenter={initialCenter}
      initialZoom={isValidCoord(project.coord) ? 17 : 5.5}
      initialPitch={55}
      edgeFade={edgeFade}
    >
      <SignalMarker project={project} />
    </BaseMap>
  )
}

export default React.memo<Props>(MapDetailTrafficSignal)
