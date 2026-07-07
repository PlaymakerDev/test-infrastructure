"use client"
import React from 'react'
import MarkerLayer, { type MarkerLayerProps, type MarkerColor } from '../primitives/MarkerLayer'
import { SYSTEMS, type SystemType } from '@/features/admin/dashboard/data/systems'
import { useDeviceIcon } from '../hooks/useDeviceIcon'

type Props = Omit<MarkerLayerProps, 'color' | 'iconImage'> & {
  /** Device type — picks the dashboard color (SYSTEMS) + menu glyph. */
  type: SystemType
  /** Override the marker color (defaults to `SYSTEMS[type].color`). */
  color?: MarkerColor
}

/**
 * Overall-map marker layer that renders the SAME colored pin + menu glyph as the
 * dashboard (color from `SYSTEMS`, icon via `useDeviceIcon`) instead of a plain
 * colored dot. Must be rendered inside a `BaseMap`. Clustering / popup / sizing
 * pass straight through to `MarkerLayer`.
 */
const DeviceMarkerLayer: React.FC<Props> = ({ type, color, ...rest }) => {
  const iconImage = useDeviceIcon(type)
  return <MarkerLayer {...rest} color={color ?? SYSTEMS[type].color} iconImage={iconImage} />
}

export default DeviceMarkerLayer
