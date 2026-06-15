"use client"
import React, { useEffect } from 'react'
import { TbMapPin } from 'react-icons/tb'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { useMap } from '@/components/map/hooks/useMap'
import { useDetailContext } from '../../../context'

interface Props {
  /** Optional vignette overlay forwarded to BaseMap. */
  edgeFade?: MapEdgeFadeProps
}

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

const isValidCoord = (c: [number, number]): boolean =>
  c[0] !== 0 || c[1] !== 0

/** Inner component — runs inside MapContext so it can flyTo when coord
 *  arrives from the overview API (which may load after first paint). */
const SignalMarker: React.FC<{ coord: [number, number]; label: string }> = ({
  coord,
  label,
}) => {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded || !isValidCoord(coord)) return
    map.flyTo({ center: coord, zoom: 17, duration: 1000 })
  }, [map, isLoaded, coord])

  if (!isValidCoord(coord)) return null

  return (
    <HTMLMarker lngLat={coord} anchor='bottom' title={label}>
      <div
        className='flex items-center justify-center'
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#FCD116',
          boxShadow: '0 4px 12px rgba(252,209,22,0.6)',
          border: '2px solid #fff',
        }}
      >
        <TbMapPin size={20} color='#212121' />
      </div>
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
      <SignalMarker coord={project.coord} label={project.installPoint} />
    </BaseMap>
  )
}

export default React.memo<Props>(MapDetailTrafficSignal)
