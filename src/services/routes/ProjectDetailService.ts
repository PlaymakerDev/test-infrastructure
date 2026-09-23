import { APIRequestCreateRoadSolution, APIRequestCreateSolution, APIRequestRoadSolution, APIRequestSolution, APIRequestUpdateSolution, APIRequestUpdateSolutionLocation, APIResponseCameraCrossingCode, APIResponseCreateRoadSolution, APIResponseDeleteSolution, APIResponseDeleteSolutionLocation, APIResponseProjectByID, APIResponseProjectRoadCameras, APIResponseRoadSolution, APIResponseSolution, APIResponseSolutionByID, APIResponseSolutionCameraList, APIResponseUpdateSolution, APIResponseUpdateSolutionLocation } from "@/types/manage/project-detail-api";
import ApiService from "../ApiService";

export const getProjectByIDAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseProjectByID>({
    url: `/manage/project/${id}`,
    method: 'GET',
  })

export const getRoadSolutionAPI = (params: APIRequestRoadSolution) =>
  ApiService.fetchData<APIResponseRoadSolution, APIRequestRoadSolution>({
    url: `/manage/solution/road_solution`,
    method: 'GET',
    params
  })

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