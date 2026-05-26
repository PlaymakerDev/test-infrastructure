"use client"
import React from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'

interface Props {}

/** Cluster marker shown on the map — yellow circle with a number inside.
 *  Mirrors the bridge-lighting overall map style. */
const NumberedMarker: React.FC<{ number: number }> = ({ number }) => (
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

/** Hardcoded cluster aggregates per region. Matches the dot positions in
 *  the Figma reference (counts per province / region rather than per
 *  individual signal — looks less cluttered on a country-level map). */
const REGION_CLUSTERS: { lng: number; lat: number; count: number }[] = [
  { lng: 100.0, lat: 19.0, count: 4 },   // เหนือบน
  { lng: 99.7, lat: 18.0, count: 12 },   // เชียงราย / เชียงใหม่
  { lng: 102.5, lat: 17.5, count: 16 },  // อีสานบน
  { lng: 100.5, lat: 16.0, count: 2 },   // ภาคกลางตอนบน
  { lng: 102.0, lat: 15.5, count: 9 },   // อีสานกลาง
  { lng: 99.8, lat: 15.3, count: 15 },   // ตะวันตก
  { lng: 100.4, lat: 14.8, count: 25 },  // กลาง / กทม.
  { lng: 99.8, lat: 14.5, count: 7 },    // กลาง-ตะวันตก
  { lng: 102.5, lat: 14.5, count: 3 },   // ตะวันออก
  { lng: 100.0, lat: 13.5, count: 12 },  // กลาง-ใต้
  { lng: 101.5, lat: 13.0, count: 6 },   // ภาคตะวันออก
  { lng: 100.0, lat: 9.0, count: 9 },    // ใต้บน
  { lng: 100.2, lat: 7.5, count: 5 },    // ใต้กลาง
  { lng: 100.6, lat: 6.5, count: 2 },    // ใต้ล่าง
]

const MapTrafficSignal: React.FC<Props> = () => {
  return (
    <BaseMap
      initialCenter={[100.5, 14.0]}
      initialZoom={5.2}
      edgeFade={{ all: 20 }}
    >
      <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
      {REGION_CLUSTERS.map((c, idx) => (
        <HTMLMarker
          key={idx}
          lngLat={[c.lng, c.lat]}
          anchor='center'
          title={`${c.count} จุดติดตั้ง`}
        >
          <NumberedMarker number={c.count} />
        </HTMLMarker>
      ))}
    </BaseMap>
  )
}

export default React.memo<Props>(MapTrafficSignal)
