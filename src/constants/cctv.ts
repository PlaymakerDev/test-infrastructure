/**
 * Canonical device-type badge registry for the camera features
 * (cctv / traffic-signal / incident-detection).
 *
 * Colors keep the SAME HUE FAMILY as the dashboard device legend (`SYSTEMS` in
 * src/features/admin/dashboard/data/systems.ts) but are BRIGHTENED — the legend
 * colors are dark because they fill solid donut segments; here they're outline
 * pills on a near-black background, so each hue is raised in luminance to stay
 * readable. (Same hue → recognisable; brighter → legible on dark bg.)
 *
 * `key`   — the CCTV/solution API field (presence drives display).
 * `label` — display name. Volume / Incident / Tracking are the renamed
 *           Counting / Analytic / WIM; CCTV / VMS / Traffic / Crosswalk keep
 *           their original names.
 */
export const DEVICE_BADGE = {
  cctv:       { label: 'CCTV',      color: '#4DA3FF' }, // blue   (legend #003F87)
  vms:        { label: 'VMS',       color: '#FF9F45' }, // orange (legend #874600)
  wim_camera: { label: 'Tracking',  color: '#E879DE' }, // purple (legend #70196D)
  counting:   { label: 'Volume',    color: '#2DD4BF' }, // teal   (legend #007787)
  analytic:   { label: 'Incident',  color: '#3DD68C' }, // green  (legend #00873B)
  traffic:    { label: 'Traffic',   color: '#A3E635' }, // lime   (legend #518700)
  crosswalk:  { label: 'Crosswalk', color: '#7C8CFF' }, // indigo (legend #001287)
} as const

export type DeviceBadgeKey = keyof typeof DEVICE_BADGE

/**
 * Solution badges for the Live Stream modal's "ประเภทอุปกรณ์" row — every
 * device type except the CCTV base (always implied). Keyed by the CCTV
 * detail-response field so `data?.[key]` presence drives which pills show.
 * Label + color are sourced from DEVICE_BADGE (single source of truth).
 */
export const SOLUTION_BADGE_MAP = [
  { key: 'vms',        ...DEVICE_BADGE.vms },
  { key: 'wim_camera', ...DEVICE_BADGE.wim_camera },
  { key: 'counting',   ...DEVICE_BADGE.counting },
  { key: 'analytic',   ...DEVICE_BADGE.analytic },
  { key: 'traffic',    ...DEVICE_BADGE.traffic },
  { key: 'crosswalk',  ...DEVICE_BADGE.crosswalk },
] as const

export const TEXT_CAMERA_STATUS = {
  "connected": {
    "name": "Connected",
    "color": "#00FF00"
  },
  "connecting": {
    "name": "Connecting",
    "color": "#FFFF00"
  },
  "retrying": {
    "name": "Retrying",
    "color": "#FFA500"
  },
  "error": {
    "name": "Error",
    "color": "#FF0000"
  },
}