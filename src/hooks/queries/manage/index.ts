// Barrel exports for the Settings (/manage) query hooks.
// Importers only ever need one path: `@/hooks/queries/manage`.

export { manageKeys } from './queryKeys'

// Projects
export { useProjectsList } from './useProjectsList'
export { useProjectDetail } from './useProjectDetail'
export { useCreateProject } from './useCreateProject'
export { useUpdateProject } from './useUpdateProject'
export { useDeleteProject } from './useDeleteProject'
export { useBudgetYears } from './useBudgetYears'
export { useProjectContractors } from './useProjectContractors'

// Contractors
export { useContractorsList } from './useContractorsList'
export { useCreateContractor } from './useCreateContractor'
export { useUpdateContractor } from './useUpdateContractor'
export { useDeleteContractor } from './useDeleteContractor'

// Roads
export { useRoadsList } from './useRoadsList'
export { useCreateRoad } from './useCreateRoad'
export { useUpdateRoad } from './useUpdateRoad'
export { useDeleteRoad } from './useDeleteRoad'

// General users
export { useUsersList } from './useUsersList'
export { useCreateUser } from './useCreateUser'
export { useUpdateUser } from './useUpdateUser'
export { useDeleteUser } from './useDeleteUser'
export { useUpdateUserPassword } from './useUpdateUserPassword'

// Shared dropdowns
export { useDepartments } from './useDepartments'
export { useRegions } from './useRegions'

// Logged-in user's home department (menu links / post-login landing)
export { useHomeDeptId, resolveHomeDeptId, deptQuery } from './useHomeDeptId'

// LDAP / SSO search
export { useSsoSearch } from './useSsoSearch'

// Notifications summary — one row per source_type over a date window.
export { useNotificationSummary } from './useNotificationSummary'

// Project detail — camera CRUD (via /cctv/cameras)
export { useCreateCamera, useDeleteCamera, useUpdateCamera } from './camera'

// Project detail — road_solution / solution / cameras / equipments
export {
  useSolutionTypes,
  useSolutionTypesAtLocation,
  useRoadSolutions,
  useSolutions,
  useSolutionDetail,
  useSolutionCameras,
  useSolutionVmsCameras,
  useCrossingCodes,
  useEquipmentsList,
  useCreateRoadSolution,
  useUpdateSolutionLocation,
  useDeleteSolutionLocation,
  useDeleteProjectRoad,
  useCreateSolution,
  useUpdateSolution,
  useDeleteSolution,
  useAttachCountingCameras,
  useAttachAnalyticCameras,
  useAttachCrosswalkCameras,
  useAttachWimCameras,
  useAttachTrafficCameras,
  useCreateVMSSolution,
  useAppendVmsCameras,
  useLinkWimStation,
} from './solution'
