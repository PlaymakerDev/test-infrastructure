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

/** One row from the modal's roads list. `projectRoadId` is defined when
 *  the row was loaded from an existing project (edit mode) and MUST be
 *  echoed back on PUT so the backend updates that row in place instead
 *  of inserting a duplicate. */
export interface ProjectFormRoad {
  roadId: string
  projectRoadId?: number
}

export interface ProjectFormValues {
  name: string
  budgetYear: number | null
  contractNo: string
  code: string
  owner: string
  contractor: string
  roads: ProjectFormRoad[]
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
