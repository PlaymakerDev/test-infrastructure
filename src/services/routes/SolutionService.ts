// Settings → Project detail (/api-v2/manage/solution/*) API wrappers.
// Mirrors the ManageService.ts idiom: standalone exported functions, each
// returning `ApiService.fetchData<T>({...})`. Backend contract verified
// 2026-07-18 against manage/internal/api/handler/solution_handler.go.

import ApiService from '../ApiService'
import type {
  APIRequestCreateRoadSolution,
  APIRequestCreateSolution,
  APIRequestCreateVMSSolution,
  APIRequestCreateVMSSolutionExistingCamera,
  APIRequestSolutionAddCamera,
  APIRequestSolutionAddCameraTraffic,
  APIRequestSolutionVmsAddCamera,
  APIRequestSolutionWimStation,
  APIRequestUpdateSolution,
  APIRequestUpdateSolutionLocation,
  APIResponseCameraListEnvelope,
  APIResponseCrossingCodes,
  APIResponseRoadSolution,
  APIResponseSolution,
  APIResponseSolutionCameraList,
  APIResponseSolutionType,
  APIResponseSolutionTypeAtLocation,
  APIResponseSolutionVmsCameraList,
  APIResponseVMSSolutionDetail,
  EquipmentListParams,
} from '@/types/manage/solution-api'

// ── Solution types ──────────────────────────────────────────────────────────

export const getSolutionTypesAPI = () =>
  ApiService.fetchData<APIResponseSolutionType[]>({
    url: '/manage/solution/type',
    method: 'GET',
  })

/** Types present at a specific solution location + counts. */
export const getSolutionTypesAtLocationAPI = (solutionLocationId: number) =>
  ApiService.fetchData<APIResponseSolutionTypeAtLocation[]>({
    url: `/manage/solution/type/${solutionLocationId}`,
    method: 'GET',
  })

// ── Road-solution (project_road with nested solution_locations) ─────────────

/** GET /manage/solution/road_solution?project_id=X — returns each
 *  project_road preloaded with its solution_locations. */
export const getRoadSolutionsAPI = (projectId: number) =>
  ApiService.fetchData<APIResponseRoadSolution[]>({
    url: '/manage/solution/road_solution',
    method: 'GET',
    params: { project_id: projectId },
  })

export const createRoadSolutionAPI = (body: APIRequestCreateRoadSolution) =>
  ApiService.fetchData<void, APIRequestCreateRoadSolution>({
    url: '/manage/solution/road_solution',
    method: 'POST',
    data: body,
  })

/** Note the misleading route: DELETE /solution/road_solution/{id} deletes
 *  a `tbl_project_roads` row (NOT a solution_location). Prefer
 *  `deleteSolutionLocationAPI` when what the user wants is remove a
 *  point at an existing route. */
export const deleteProjectRoadAPI = (projectRoadId: number) =>
  ApiService.fetchData<void>({
    url: `/manage/solution/road_solution/${projectRoadId}`,
    method: 'DELETE',
  })

// ── Solution locations (installation points) ────────────────────────────────

export const updateSolutionLocationAPI = (
  id: number,
  body: APIRequestUpdateSolutionLocation,
) =>
  ApiService.fetchData<void, APIRequestUpdateSolutionLocation>({
    url: `/manage/solution/solution_location/${id}`,
    method: 'PUT',
    data: body,
  })

export const deleteSolutionLocationAPI = (id: number) =>
  ApiService.fetchData<void>({
    url: `/manage/solution/solution_location/${id}`,
    method: 'DELETE',
  })

// ── Solutions (task types) ──────────────────────────────────────────────────

/** GET /manage/solution?solution_location_id=X */
export const getSolutionsAPI = (solutionLocationId: number) =>
  ApiService.fetchData<APIResponseSolution[]>({
    url: '/manage/solution',
    method: 'GET',
    params: { solution_location_id: solutionLocationId },
  })

export const getSolutionByIdAPI = (id: number) =>
  ApiService.fetchData<APIResponseSolution>({
    url: `/manage/solution/details/${id}`,
    method: 'GET',
  })

export const createSolutionAPI = (body: APIRequestCreateSolution) =>
  ApiService.fetchData<void, APIRequestCreateSolution>({
    url: '/manage/solution',
    method: 'POST',
    data: body,
  })

export const updateSolutionAPI = (id: number, body: APIRequestUpdateSolution) =>
  ApiService.fetchData<void, APIRequestUpdateSolution>({
    url: `/manage/solution/${id}`,
    method: 'PUT',
    data: body,
  })

export const deleteSolutionAPI = (id: number) =>
  ApiService.fetchData<void>({
    url: `/manage/solution/${id}`,
    method: 'DELETE',
  })

// ── Camera assignment per solution type ─────────────────────────────────────

/** Attach cameras to a Counting/Traffic Volume solution. Replaces existing. */
export const attachCountingCamerasAPI = (body: APIRequestSolutionAddCamera) =>
  ApiService.fetchData<void, APIRequestSolutionAddCamera>({
    url: '/manage/solution/camera/counting',
    method: 'POST',
    data: body,
  })

/** Attach cameras to an Analytic/Incident Detection solution. Replaces. */
export const attachAnalyticCamerasAPI = (body: APIRequestSolutionAddCamera) =>
  ApiService.fetchData<void, APIRequestSolutionAddCamera>({
    url: '/manage/solution/camera/analytic',
    method: 'POST',
    data: body,
  })

/** Attach cameras to a Crosswalk solution. Replaces. */
export const attachCrosswalkCamerasAPI = (body: APIRequestSolutionAddCamera) =>
  ApiService.fetchData<void, APIRequestSolutionAddCamera>({
    url: '/manage/solution/camera/crosswalk',
    method: 'POST',
    data: body,
  })

/** Attach cameras to a WIM solution. Replaces.
 *  BUG WATCH: backend `Delete(&models.Wim{})` filters by wim_id but calls
 *  Delete on the parent Wim table — verify before shipping. */
export const attachWimCamerasAPI = (body: APIRequestSolutionAddCamera) =>
  ApiService.fetchData<void, APIRequestSolutionAddCamera>({
    url: '/manage/solution/camera/wim',
    method: 'POST',
    data: body,
  })

/** Attach phased cameras to a Traffic Signal solution. Replaces. */
export const attachTrafficCamerasAPI = (
  body: APIRequestSolutionAddCameraTraffic,
) =>
  ApiService.fetchData<void, APIRequestSolutionAddCameraTraffic>({
    url: '/manage/solution/camera/traffic',
    method: 'POST',
    data: body,
  })

/** Create/update a VMS solution with its desktop-screen URL, linking cameras
 *  that already exist. Upsert on solution_id — camera links are REPLACED by
 *  the ids sent, so send the full list. This is the provisioning call the UI
 *  uses. */
export const createVMSSolutionExistingCameraAPI = (
  body: APIRequestCreateVMSSolutionExistingCamera,
) =>
  ApiService.fetchData<void, APIRequestCreateVMSSolutionExistingCamera>({
    url: '/manage/solution/vms/solution/existing_camera',
    method: 'POST',
    data: body,
  })

/** @deprecated Legacy provisioning call that mints new camera rows from inline
 *  definitions. Use {@link createVMSSolutionExistingCameraAPI}. No UI
 *  consumers as of the existing-camera swap. */
export const createVMSSolutionAPI = (body: APIRequestCreateVMSSolution) =>
  ApiService.fetchData<void, APIRequestCreateVMSSolution>({
    url: '/manage/solution/vms/solution',
    method: 'POST',
    data: body,
  })

/** Append cameras to an existing VMS solution instance. Does NOT delete
 *  existing rows first — unique to VMS. */
export const appendVmsCamerasAPI = (body: APIRequestSolutionVmsAddCamera) =>
  ApiService.fetchData<void, APIRequestSolutionVmsAddCamera>({
    url: '/manage/solution/camera/vms',
    method: 'POST',
    data: body,
  })

/** Link a WIM Solution to a WIM station. Prefer sending station_id in the
 *  initial `POST /solution` (with type=9) instead of a separate call. */
export const linkWimStationAPI = (body: APIRequestSolutionWimStation) =>
  ApiService.fetchData<void, APIRequestSolutionWimStation>({
    url: '/manage/solution/wim/station',
    method: 'POST',
    data: body,
  })

// ── Camera / crossing-code reads ────────────────────────────────────────────

/** GET /solution/camera/list/{solution_location_id} — CCTVs at a location. */
export const getSolutionCameraListAPI = (solutionLocationId: number) =>
  ApiService.fetchData<APIResponseSolutionCameraList>({
    url: `/manage/solution/camera/list/${solutionLocationId}`,
    method: 'GET',
  })

/** GET /solution/vms/solution/{solution_id} — current desktop-screen URL +
 *  linked camera ids, for prefilling the VMS provisioning form. */
export const getVMSSolutionDetailAPI = (solutionId: number) =>
  ApiService.fetchData<APIResponseVMSSolutionDetail>({
    url: `/manage/solution/vms/solution/${solutionId}`,
    method: 'GET',
  })

/** GET /solution/camera/vms/{solution_id} — VMS cameras. */
export const getSolutionVmsCameraListAPI = (solutionId: number) =>
  ApiService.fetchData<APIResponseSolutionVmsCameraList>({
    url: `/manage/solution/camera/vms/${solutionId}`,
    method: 'GET',
  })

export const getCrossingCodesAPI = (solutionId: number) =>
  ApiService.fetchData<APIResponseCrossingCodes>({
    url: `/manage/solution/camera/crossing_codes/${solutionId}`,
    method: 'GET',
  })

// ── Equipments (paginated camera list) ──────────────────────────────────────

/** GET /equipments — both road_id and solution_location_id are marked
 *  `binding:"required"` on the backend DTO. Pass 0 to mean "no filter". */
export const getEquipmentsAPI = (params: EquipmentListParams) =>
  ApiService.fetchData<APIResponseCameraListEnvelope>({
    url: '/manage/equipments',
    method: 'GET',
    params,
  })
