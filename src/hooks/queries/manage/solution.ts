// Settings → Project detail (/manage/solution/*) query + mutation hooks.
// Consolidated into a single file because the detail-page surface has
// ~24 endpoints — one-file-per-hook would be pure boilerplate. Each hook
// still follows the same shape as the sibling manage hooks: unwrap
// `.then(r => r.data)`, invalidate the entity's `.all` key on write,
// echo the specific `.detail(id)` when relevant.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  appendVmsCamerasAPI,
  attachAnalyticCamerasAPI,
  attachCountingCamerasAPI,
  attachCrosswalkCamerasAPI,
  attachTrafficCamerasAPI,
  attachWimCamerasAPI,
  createRoadSolutionAPI,
  createSolutionAPI,
  createVMSSolutionAPI,
  deleteProjectRoadAPI,
  deleteSolutionAPI,
  deleteSolutionLocationAPI,
  getCrossingCodesAPI,
  getEquipmentsAPI,
  getRoadSolutionsAPI,
  getSolutionByIdAPI,
  getSolutionCameraListAPI,
  getSolutionTypesAPI,
  getSolutionTypesAtLocationAPI,
  getSolutionVmsCameraListAPI,
  getSolutionsAPI,
  linkWimStationAPI,
  updateSolutionAPI,
  updateSolutionLocationAPI,
} from '@/services/routes/SolutionService'
import type {
  APIRequestCreateRoadSolution,
  APIRequestCreateSolution,
  APIRequestCreateVMSSolution,
  APIRequestSolutionAddCamera,
  APIRequestSolutionAddCameraTraffic,
  APIRequestSolutionVmsAddCamera,
  APIRequestSolutionWimStation,
  APIRequestUpdateSolution,
  APIRequestUpdateSolutionLocation,
  EquipmentListParams,
} from '@/types/manage/solution-api'
import { manageKeys } from './queryKeys'

// ─── Reads ──────────────────────────────────────────────────────────────────

/** Master list of the ~10 solution types. Cache long — this is seed data. */
export const useSolutionTypes = () =>
  useQuery({
    queryKey: manageKeys.solutionTypes.all(),
    queryFn: () => getSolutionTypesAPI().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

/** Task-type rows present at a specific location plus per-type counts. */
export const useSolutionTypesAtLocation = (
  solutionLocationId: number | null | undefined,
) =>
  useQuery({
    queryKey: manageKeys.solutions.typesAtLocation(solutionLocationId ?? ''),
    queryFn: () =>
      getSolutionTypesAtLocationAPI(solutionLocationId as number).then((r) => r.data),
    enabled: solutionLocationId != null,
  })

/** GET /solution/road_solution?project_id — the project's routes and
 *  installation points in one call. */
export const useRoadSolutions = (projectId: number | null | undefined) =>
  useQuery({
    queryKey: manageKeys.roadSolutions.byProject(projectId ?? ''),
    queryFn: () => getRoadSolutionsAPI(projectId as number).then((r) => r.data),
    enabled: projectId != null,
  })

/** GET /solution?solution_location_id — solutions (task types) at a
 *  specific installation point. */
export const useSolutions = (
  solutionLocationId: number | null | undefined,
) =>
  useQuery({
    queryKey: manageKeys.solutions.byLocation(solutionLocationId ?? ''),
    queryFn: () => getSolutionsAPI(solutionLocationId as number).then((r) => r.data),
    enabled: solutionLocationId != null,
  })

export const useSolutionDetail = (id: number | null | undefined) =>
  useQuery({
    queryKey: manageKeys.solutions.detail(id ?? ''),
    queryFn: () => getSolutionByIdAPI(id as number).then((r) => r.data),
    enabled: id != null,
  })

/** CCTV cameras at an installation point. Backend returns `null` (not
 *  an empty array) when no CCTV solutions exist at that location — we
 *  normalize to `[]` here so callers never have to null-check. */
export const useSolutionCameras = (
  solutionLocationId: number | null | undefined,
) =>
  useQuery({
    queryKey: manageKeys.solutions.camerasAtLocation(solutionLocationId ?? ''),
    queryFn: () =>
      getSolutionCameraListAPI(solutionLocationId as number).then((r) => r.data ?? []),
    enabled: solutionLocationId != null,
  })

/** Cameras attached to a VMS solution. */
export const useSolutionVmsCameras = (solutionId: number | null | undefined) =>
  useQuery({
    queryKey: manageKeys.solutions.vmsCameras(solutionId ?? ''),
    queryFn: () =>
      getSolutionVmsCameraListAPI(solutionId as number).then((r) => r.data),
    enabled: solutionId != null,
  })

/** Crossing codes for Traffic/Counting/Analytic/Crosswalk solutions. */
export const useCrossingCodes = (solutionId: number | null | undefined) =>
  useQuery({
    queryKey: manageKeys.solutions.crossingCodes(solutionId ?? ''),
    queryFn: () => getCrossingCodesAPI(solutionId as number).then((r) => r.data),
    enabled: solutionId != null,
  })

/** GET /equipments — server-paginated camera list. Both road_id and
 *  solution_location_id are `binding:"required"` on the backend so pass 0
 *  to mean "no filter". */
export const useEquipmentsList = (params: EquipmentListParams) =>
  useQuery({
    queryKey: manageKeys.equipments.list(params as unknown as Record<string, unknown>),
    queryFn: () => getEquipmentsAPI(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

// ─── Mutations: road_solution / solution_location ───────────────────────────

/** POST /solution/road_solution — create a new installation point on a
 *  project's road. */
export const useCreateRoadSolution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestCreateRoadSolution) =>
      createRoadSolutionAPI(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.roadSolutions.all })
    },
  })
}

/** PUT /solution/solution_location/{id} — rename an installation point. */
export const useUpdateSolutionLocation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: APIRequestUpdateSolutionLocation }) =>
      updateSolutionLocationAPI(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.roadSolutions.all })
    },
  })
}

/** DELETE /solution/solution_location/{id} — remove an installation point. */
export const useDeleteSolutionLocation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSolutionLocationAPI(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.roadSolutions.all })
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
    },
  })
}

/** DELETE /solution/road_solution/{id} — remove the entire route from
 *  the project. Backend actually deletes the tbl_project_roads row. */
export const useDeleteProjectRoad = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectRoadId: number) =>
      deleteProjectRoadAPI(projectRoadId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.roadSolutions.all })
      qc.invalidateQueries({ queryKey: manageKeys.projects.all })
    },
  })
}

// ─── Mutations: solutions (task types) ──────────────────────────────────────

export const useCreateSolution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestCreateSolution) =>
      createSolutionAPI(body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({
        queryKey: manageKeys.solutions.byLocation(variables.solution_location_id),
      })
      qc.invalidateQueries({
        queryKey: manageKeys.solutions.typesAtLocation(variables.solution_location_id),
      })
    },
  })
}

export const useUpdateSolution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: APIRequestUpdateSolution }) =>
      updateSolutionAPI(id, data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({ queryKey: manageKeys.solutions.detail(variables.id) })
    },
  })
}

export const useDeleteSolution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSolutionAPI(id).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.removeQueries({ queryKey: manageKeys.solutions.detail(id) })
    },
  })
}

// ─── Mutations: camera attach ──────────────────────────────────────────────

/** Attach cameras to a Counting (Traffic Volume) solution. */
export const useAttachCountingCameras = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestSolutionAddCamera) =>
      attachCountingCamerasAPI(body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({
        queryKey: manageKeys.solutions.crossingCodes(variables.solution_id),
      })
    },
  })
}

/** Attach cameras to an Analytic (Incident Detection) solution. */
export const useAttachAnalyticCameras = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestSolutionAddCamera) =>
      attachAnalyticCamerasAPI(body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({
        queryKey: manageKeys.solutions.crossingCodes(variables.solution_id),
      })
    },
  })
}

export const useAttachCrosswalkCameras = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestSolutionAddCamera) =>
      attachCrosswalkCamerasAPI(body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({
        queryKey: manageKeys.solutions.crossingCodes(variables.solution_id),
      })
    },
  })
}

export const useAttachWimCameras = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestSolutionAddCamera) =>
      attachWimCamerasAPI(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
    },
  })
}

/** Attach phased cameras to a Traffic Signal solution. */
export const useAttachTrafficCameras = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestSolutionAddCameraTraffic) =>
      attachTrafficCamerasAPI(body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({
        queryKey: manageKeys.solutions.crossingCodes(variables.solution_id),
      })
    },
  })
}

/** Provision a VMS solution with its cameras + desktop URL in one call. */
export const useCreateVMSSolution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestCreateVMSSolution) =>
      createVMSSolutionAPI(body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({
        queryKey: manageKeys.solutions.vmsCameras(variables.solution_id),
      })
    },
  })
}

/** Append cameras to an existing VMS solution. */
export const useAppendVmsCameras = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestSolutionVmsAddCamera) =>
      appendVmsCamerasAPI(body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: manageKeys.solutions.vmsCameras(variables.vms_id),
      })
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
    },
  })
}

export const useLinkWimStation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestSolutionWimStation) =>
      linkWimStationAPI(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
    },
  })
}
