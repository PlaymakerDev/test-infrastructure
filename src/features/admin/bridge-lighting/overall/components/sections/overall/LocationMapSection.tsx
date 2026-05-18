"use client"
import React from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { BRIDGE_PROJECTS } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface NumberedMarkerProps {
  number: number
}

/** Yellow numbered circle marker — matches the Figma design (all bridges
 *  use yellow regardless of online/offline status; status is shown in the table). */
const NumberedMarker: React.FC<NumberedMarkerProps> = ({ number }) => (
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: '#FCD116',
      color: '#212121',
      fontWeight: 700,
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(252,209,22,0.5)',
      border: '2px solid #fff',
      fontFamily: 'ui-sans-serif, system-ui',
    }}
  >
    {number}
  </div>
)

interface Props {}

const LocationMapSection: React.FC<Props> = () => {
  return (
    <BaseMap initialCenter={[101.0, 14.5]} initialZoom={5.4}>
      {/* Mask matches the page background (--background: #212121) at full
        * opacity so the area outside Thailand blends seamlessly with the
        * rest of the screen — no visible boundary on the map edges. */}
      <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
      {BRIDGE_PROJECTS.map((bridge, idx) => (
        <HTMLMarker
          key={bridge.id}
          lngLat={bridge.coord}
          anchor='center'
          title={`${bridge.installPoint} · ${bridge.projectName}`}
        >
          <NumberedMarker number={idx + 1} />
        </HTMLMarker>
      ))}
    </BaseMap>
  )
}

export default React.memo<Props>(LocationMapSection)
