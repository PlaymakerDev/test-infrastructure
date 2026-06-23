import React from 'react'
import type { CCTVCameraResponse } from '@/types/cctv/camera-api'

/** Display color per camera-function tag. CCTV is the base (every camera in
 *  this feature is a CCTV camera); the rest are extra solution types the
 *  camera also participates in. */
const FUNCTION_COLORS: Record<string, string> = {
  CCTV: '#f97316',
  Counting: '#a3e635',
  Analytic: '#22c55e',
  Traffic: '#05F2DB',
  Crosswalk: '#B2FF00',
  WIM: '#FCD116',
  VMS: '#66AEFF',
}

/** Derive the visible function tags from a camera's solution-type fields.
 *  Null fields are skipped (the camera doesn't participate in that solution).
 *  "CCTV" is always shown as the base tag. */
export const extractCameraFunctions = (cam: CCTVCameraResponse): string[] => {
  const fns: string[] = ['CCTV']
  if (cam.counting) fns.push('Counting')
  if (cam.analytic) fns.push('Analytic')
  if (cam.traffic) fns.push('Traffic')
  if (cam.crosswalk) fns.push('Crosswalk')
  if (cam.wim_camera) fns.push('WIM')
  if (cam.vms) fns.push('VMS')
  return fns
}

/** Outlined pill for a single function tag. Unknown tags fall back to gray. */
export const CameraFunctionTag: React.FC<{ tag: string }> = ({ tag }) => {
  const color = FUNCTION_COLORS[tag] ?? '#888'
  return (
    <span
      className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {tag}
    </span>
  )
}
