"use client"
import React from 'react'
import { TbMapPin } from 'react-icons/tb'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { useDetailContext } from '../../../context'

interface Props {
  /** Optional vignette overlay forwarded to BaseMap. */
  edgeFade?: MapEdgeFadeProps
}

/** Single-intersection map used as the Tab1 background.
 *  Higher zoom + pitch so the intersection fills the viewport like Figma. */
const MapDetailTrafficSignal: React.FC<Props> = ({ edgeFade }) => {
  const { project } = useDetailContext()
  return (
    <BaseMap
      initialCenter={project.coord}
      initialZoom={17}
      initialPitch={55}
      edgeFade={edgeFade}
    >
      <HTMLMarker lngLat={project.coord} anchor='bottom' title={project.installPoint}>
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
    </BaseMap>
  )
}

export default React.memo<Props>(MapDetailTrafficSignal)
