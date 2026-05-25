"use client"
import React from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'

interface Props {
  edgeFade?: MapEdgeFadeProps
}

const MapSection: React.FC<Props> = ({ edgeFade }) => (
  <BaseMap initialCenter={[100.5018, 13.7563]} initialZoom={11} edgeFade={edgeFade}>
    <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
  </BaseMap>
)

export default React.memo(MapSection)
