// Barrel exports for Traffic Signal query hooks.
// Use these directly in components: `useTrafficOverview(deptId)` etc.

export { trafficSignalKeys } from './queryKeys'

// Overview
export { useTrafficOverview } from './useTrafficOverview'
export { useTrafficTotals } from './useTrafficTotals'
export { useTrafficList } from './useTrafficList'
export { useTrafficCentralList } from './useTrafficCentralList'
export { useTrafficOverviewDropdowns } from './useTrafficOverviewDropdowns'
export { useTrafficRandomCameras } from './useTrafficRandomCameras'
export { useTrafficCameraList } from './useTrafficCameraList'
export { useTrafficCameraCentralList } from './useTrafficCameraCentralList'
export { useTrafficCameraDropdowns } from './useTrafficCameraDropdowns'

// Detail
export { useTrafficContractInfo } from './useTrafficContractInfo'
export { useTrafficSolutionDetail } from './useTrafficSolutionDetail'
export { useTrafficDetails } from './useTrafficDetails'
export { useTrafficPhaseDetails } from './useTrafficPhaseDetails'
export { useTrafficSolutionCameras } from './useTrafficSolutionCameras'
export { useTrafficGraph } from './useTrafficGraph'
export { useTrafficSummary } from './useTrafficSummary'
export { useTrafficReports } from './useTrafficReports'
