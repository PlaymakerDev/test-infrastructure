import { MetaData } from "../shared";

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
}

export interface APIResponseVMSList {
  res_data: ListResData[];
  meta_data: MetaData;
}

export interface ListResData {
  road: Road
  project: Project
  solution: Solution
  vms: Vms
  warranty: ListWarranty
}

export interface ListWarranty {
  is_warranty: boolean
  name: string
}

export interface APIResponseVMSTotal {
  solution: TotalSolution
  warranty: TotalWarranty
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

export interface APIRequestVMSRandomOnline {
  limit: number
}

export interface APIResponseVMSRandomOnline {
  solution: Solution
  road: Road
  project: Project
  vms: Vms
}

export interface APIResponseVMSOverview {
  locations: Location[]
  centroid: number[]
}

export interface Location {
  solution: Solution
  road: Road
  vms: Vms
  GeometryPoint: number[]
}

export interface Solution {
  id: number
  solution_name: string
}

export interface Road {
  id: number
  code_name: string
}

export interface Vms {
  anydesk: string
  last_connected: string
  desktop_screen: string
  hls_url: string
  status: Status
}

export interface Status {
  is_online: boolean
  name: string
}

export interface Project {
  id: number
  budget_year: number
  contract_no: string
}