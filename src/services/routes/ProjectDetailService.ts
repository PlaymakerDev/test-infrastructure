import { APIRequestCreateRoadSolution, APIRequestCreateSolution, APIRequestRoadSolution, APIRequestSolution, APIRequestUpdateSolution, APIRequestUpdateSolutionLocation, APIResponseCameraCrossingCode, APIResponseCreateRoadSolution, APIResponseDeleteSolution, APIResponseDeleteSolutionLocation, APIResponseProjectByID, APIResponseProjectBySolutionID, APIResponseProjectRoadCameras, APIResponseRoadSolution, APIResponseSolution, APIResponseSolutionByID, APIResponseSolutionCameraList, APIResponseUpdateSolution, APIResponseUpdateSolutionLocation, RoadSolutionListRaw } from "@/types/manage/project-detail-api";
import ApiService from "../ApiService";

export const getProjectByIDAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseProjectByID>({
    url: `/manage/project/${id}`,
    method: 'GET',
  })

export const getProjectBySolutionIDAPI = (solutionId: string | number) =>
  ApiService.fetchData<APIResponseProjectBySolutionID>({
    url: `/manage/project/solution/${solutionId}`,
    method: 'GET',
  })

/** The backend leaves `solution_locations` out of a road that has no
 *  จุดติดตั้ง, and the project detail page reads it as an array everywhere
 *  (the next point's name, the tabs, the CCTV panel) — a missing one crashed
 *  the whole page, e.g. right after deleting a road's last point. Anything
 *  but an array becomes `[]`, and a body that isn't an array becomes no roads. */
export const normalizeRoadSolutions = (rows: unknown): APIResponseRoadSolution =>
  Array.isArray(rows)
    ? rows.map((row: RoadSolutionListRaw) => ({
      ...row,
      solution_locations: Array.isArray(row.solution_locations) ? row.solution_locations : [],
    }))
    : []

// Normalized here rather than at each reader: TitleSection and
// EmptyRoadSolution share the ['roadSolution', id] cache entry, so both must
// get the same shape back — still the AxiosResponse, only `data` is fixed up.
export const getRoadSolutionAPI = (params: APIRequestRoadSolution) =>
  ApiService.fetchData<RoadSolutionListRaw[], APIRequestRoadSolution>({
    url: `/manage/solution/road_solution`,
    method: 'GET',
    params
  }).then((res) => ({ ...res, data: normalizeRoadSolutions(res.data) }))

export const getSolutionAPI = (params: APIRequestSolution) =>
  ApiService.fetchData<APIResponseSolution, APIRequestSolution>({
    url: `/manage/solution`,
    method: 'GET',
    params
  })

export const getCameraCrossingCodeAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseCameraCrossingCode>({
    url: `/manage/solution/camera/crossing_codes/${id}`,
    method: 'GET',
  })

export const postRoadSolutionAPI = (data: APIRequestCreateRoadSolution) =>
  ApiService.fetchData<APIResponseCreateRoadSolution, APIRequestCreateRoadSolution>({
    url: `/manage/solution/road_solution`,
    method: 'POST',
    data
  })

export const putSolutionLocationAPI = (id: string | number, data: APIRequestUpdateSolutionLocation) =>
  ApiService.fetchData<APIResponseUpdateSolutionLocation, APIRequestUpdateSolutionLocation>({
    url: `/manage/solution/solution_location/${id}`,
    method: 'PUT',
    data
  })

export const deleteSolutionLocationAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseDeleteSolutionLocation>({
    url: `/manage/solution/solution_location/${id}`,
    method: 'DELETE',
  })

export const postSolutionAPI = (data: APIRequestCreateSolution) =>
  ApiService.fetchData<APIResponseCreateRoadSolution, APIRequestCreateSolution>({
    url: `/manage/solution`,
    method: 'POST',
    data
  })

export const getSolutionByIDAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseSolutionByID>({
    url: `/manage/solution/details/${id}`,
    method: 'GET',
  })

export const putSolutionAPI = (id: string | number, data: APIRequestUpdateSolution) =>
  ApiService.fetchData<APIResponseUpdateSolution, APIRequestUpdateSolution>({
    url: `/manage/solution/${id}`,
    method: 'PUT',
    data
  })

export const deleteSolutionAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseDeleteSolution>({
    url: `/manage/solution/${id}`,
    method: 'DELETE',
  })



/** Cameras standing at ONE install point — what the Counting/Analytic/
 *  Crosswalk/WIM camera pickers read. */
export const getSolutionCameraListAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseSolutionCameraList>({
    url: `/manage/solution/camera/list/${id}`,
    method: 'GET',
  })

/** The (project, road)'s single CCTV solution plus every camera under it,
 *  each tagged with its own install point. Backs the road-level
 *  "อุปกรณ์ CCTV" panel. */
export const getProjectRoadCamerasAPI = (projectRoadId: string | number) =>
  ApiService.fetchData<APIResponseProjectRoadCameras>({
    url: `/manage/solution/camera/by_project_road/${projectRoadId}`,
    method: 'GET',
  })