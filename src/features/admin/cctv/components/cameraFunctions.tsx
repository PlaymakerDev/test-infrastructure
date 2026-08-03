import React from 'react'
import type { CCTVCameraResponse } from '@/types/cctv/camera-api'
import { DEVICE_BADGE, type DeviceBadgeKey } from '@/constants/cctv'

/** Derive the visible device-type keys from a camera's solution-type fields.
 *  Null fields are skipped (the camera doesn't participate in that solution).
 *  "cctv" is always shown as the base type. Returns DEVICE_BADGE keys — the
 *  display label + color are resolved in `CameraFunctionTag`. */
export const extractCameraFunctions = (cam: CCTVCameraResponse): DeviceBadgeKey[] => {
  const fns: DeviceBadgeKey[] = ['cctv']
  if (cam.counting) fns.push('counting')
  if (cam.analytic) fns.push('analytic')
  if (cam.traffic) fns.push('traffic')
  if (cam.crosswalk) fns.push('crosswalk')
  if (cam.wim_camera) fns.push('wim_camera')
  if (cam.vms) fns.push('vms')
  return fns
}

/** Outlined pill for a single device-type tag. Accepts a DEVICE_BADGE key
 *  (preferred) or a raw label; label + color come from DEVICE_BADGE — the
 *  single source of truth that mirrors the dashboard legend. Unknown values
 *  fall back to gray. */
export const CameraFunctionTag: React.FC<{ tag: string }> = ({ tag }) => {
  const entry = DEVICE_BADGE[tag as DeviceBadgeKey]
  const color = entry?.color ?? '#888'
  const label = entry?.label ?? tag
  return (
    <span
      className='inline-flex items-center px-2.5 py-0.5 rounded-full fs-12 font-medium whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {label}
    </span>
  )
}
