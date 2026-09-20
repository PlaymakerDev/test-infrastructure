import { APIRequestCreateRoadSolution, APIRequestCreateSolution, APIRequestRoadSolution, APIRequestSolution, APIRequestUpdateSolution, APIRequestUpdateSolutionLocation, APIResponseCameraCrossingCode, APIResponseCreateRoadSolution, APIResponseDeleteSolution, APIResponseDeleteSolutionLocation, APIResponseProjectByID, APIResponseRoadSolution, APIResponseSolution, APIResponseSolutionByID, APIResponseUpdateSolution, APIResponseUpdateSolutionLocation } from "@/types/manage/project-detail-api";
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