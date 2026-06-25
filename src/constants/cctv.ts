export const SOLUTION_BADGE_MAP = [
  { key: 'vms', label: 'VMS', color: '#3B82F6' },
  { key: 'wim_camera', label: 'Tracking', color: '#8B5CF6' },
  { key: 'counting', label: 'Volume', color: '#84CC16' },
  { key: 'analytic', label: 'Incident', color: '#F59E0B' },
  { key: 'traffic', label: 'Traffic', color: '#14B8A6' },
  { key: 'crosswalk', label: 'Crosswalk', color: '#EC4899' },
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