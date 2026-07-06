export type WarrantyStatus = 'in-warranty' | 'expired' | 'delivering'

export interface ProjectRoute {
  id: string
  code: string
}

export interface Project {
  id: string
  code: string
  name: string
  budgetYear: number
  contractNo: string
  contractor: string
  owner: string
  roads: ProjectRoute[]
  warrantyStart: string
  warrantyEnd: string
  warrantyStatus: WarrantyStatus
}

export interface ProjectFormValues {
  name: string
  budgetYear: number | null
  contractNo: string
  code: string
  owner: string
  contractor: string
  roads: string[]
  warrantyStart: string
  warrantyEnd: string
}

export interface ProjectFilters {
  budgetYear: number | null
  owner: string | null
  contractor: string | null
  search: string
}

export type ViewMode = 'list' | 'grid'
