// Barrel exports for CCTV query hooks.
// Use directly in components: `useCctvOverviewList(deptId, params)` etc.

export { cctvKeys } from './queryKeys'

// Overview (solution-level)
export { useCctvOverview } from './useCctvOverview'
export { useCctvOverviewList } from './useCctvOverviewList'
export { useCctvOverviewTotals } from './useCctvOverviewTotals'
export { useCctvOverviewDropdowns } from './useCctvOverviewDropdowns'
export { useCctvOverviewCentralList } from './useCctvOverviewCentralList'
export { useCctvOverviewCentralTotals } from './useCctvOverviewCentralTotals'

// Camera-level
export { useCctvCameras } from './useCctvCameras'
export { useCctvCameraList } from './useCctvCameraList'
export { useCctvCameraTotals } from './useCctvCameraTotals'
export { useCctvCameraDropdowns } from './useCctvCameraDropdowns'
export { useCctvRandomOnline } from './useCctvRandomOnline'
export { useCctvUptimeStatistics } from './useCctvUptimeStatistics'
export { useCctvCameraCentralList } from './useCctvCameraCentralList'
