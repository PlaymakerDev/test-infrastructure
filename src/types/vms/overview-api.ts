import { SharedProject, SharedRoad, SharedSolution, SharedVMS, SharedWarranty } from "../shared";

// LIST
export interface APIRequestVMSList {
  road_code?: string;
  contract_no?: string;
  status_name?: string;
  warranty_name?: string;
  page: number;
  search?: string;
  field?: string;
  sort?: 'ASC' | 'DESC';
  limit: number;

  // ADDED
  scope?: string
  road_id?: string | string[] | number
}

export type APIResponseVMSList = VMSList[]

export interface VMSList {
  department_id: number
  department_short_name: string
  sub_department: ListSubDepartment[]
}

export interface ListSubDepartment {
  department_id: number
  department_short_name: string
  solutions: ListSolution[]
}

export interface ListSolution {
  road: SharedRoad
  project: SharedProject
  solution: SharedSolution
  vms: SharedVMS
  warranty: SharedWarranty
  online_count: number
  offline_count: number
}

// TOTAL
export interface APIResponseVMSTotal {
  solution: TotalSolution
  warranty: TotalWarranty
}

export interface APIRequestVMSTotal {
  scope?: string
  road_id?: string | string[] | number
}

export interface TotalSolution {
  total: number
  online: number
  offline: number
}

export interface TotalWarranty {
  active: number
  expired: number
}

// RANDOM ONLINE
export interface APIRequestVMSRandomOnline {
  limit?: number
  scope?: string
  road_id?: string | string[] | number
}

export type APIResponseVMSRandomOnline = RandomOnline[]

export interface RandomOnline {
  solution: SharedSolution
  road: SharedRoad
  project: SharedProject
  vms: SharedVMS
}

// OVERVIEW
export interface APIResponseVMSOverview {
  locations: Location[]
  centroid: number[]
}

export interface APIRequestVMSOverview {
  solution_id?: string | string[] | number
  road_id?: string | string[] | number
  scope?: string
}

export interface Location {
  solution: SharedSolution
  road: SharedRoad
  vms: SharedVMS
  warranty: SharedWarranty
  GeometryPoint: number[]
}

