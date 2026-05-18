"use client"
import React from 'react'
import { TbMapPin } from 'react-icons/tb'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  bridge: BridgeProject
}

/** Single-bridge centered map used as the detail page background.
 *  Higher zoom + 3D-ish pitch so the focus bridge fills the viewport. */
const BridgeLocationMap: React.FC<Props> = ({ bridge }) => {
  return (
    <BaseMap initialCenter={bridge.coord} initialZoom={16} initialPitch={45}>
      <HTMLMarker lngLat={bridge.coord} anchor='bottom' title={bridge.installPoint}>
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

export default React.memo<Props>(BridgeLocationMap)
