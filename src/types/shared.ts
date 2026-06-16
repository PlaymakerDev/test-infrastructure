export interface APIActionResponse {
  message: string;
}

export interface PromiseProperties {
  loading: boolean;
  status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'FAILED'
}

export interface MetaData {
  count: number
  page: number
  limit: number
  total_pages: number
}

export interface SharedSolution {
  id: number
  solution_name: string
}

export interface SharedRoad {
  id: number
  code_name: string
}

export interface SharedVMS {
  anydesk: string
  last_connected: string
  desktop_screen: string
  hls_url: string
  status: SharedStatus
}

export interface SharedStatus {
  is_online: boolean
  name: string
}

export interface SharedProject {
  id: number
  name?: string
  budget_year: number
  contract_no: string
}

export interface SharedWarranty {
  is_warranty: boolean
  name: string
}