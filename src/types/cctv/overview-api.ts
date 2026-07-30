// CCTV — Overview (solution/route-level) API types
// Source: https://its.drr.go.th/api-v2/docs/cctv  (OpenAPI `cctv`)
//
// "Overview" endpoints are scoped to a department and aggregate cameras up to
// the solution/route level. Camera-level endpoints live in `camera-api.ts`.

import type { MetaData } from '../shared'

// ── Shared sub-shapes ─────────────────────────────────────────────────────────


export interface CctvRoadRef {
  id: number
  code_name: string
}

export interface CctvSolutionRef {
  id: number
  solution_name: string
}

export interface CctvProjectRef {
  id: number
  project_name: string
  budget_year: number
  contract_no: string
}

/** Camera online/offline tally attached to a solution row or totals block. */
export interface CctvCameraCount {
  total: number
  online: number
  offline: number
}

export interface CctvWarrantyCount {
  active: number
  expired: number
}

// ── GET /cctv/departments/{id}/overview ───────────────────────────────────────
// Map markers (one per solution) + centroid for default map center.
// NOTE: OpenAPI leaves the body untyped (`{}`), but the live response carries
// `locations` + `centroid` — shape preserved from the working integration.

export interface CctvOverviewLocation {
  road: CctvRoadRef
  solution: CctvSolutionRef
  total_cameras: number
  online_count: number
  offline_count: number
  /** Nullable — some solutions have no mapped coordinate yet. */
  geometry_point: [number, number] | null
}

export interface APIResponseCCTVOverview {
  centroid: [number, number] | null
  locations: CctvOverviewLocation[]
}

// ADDED
export interface APIRequestCCTVOverview {
  solution_id?: number
  road_code?: string
  contract_no?: string
  road_id?: number
}

// ── GET /cctv/departments/{id}/overview/list ──────────────────────────────────
// Paginated solution-level list (feeds the overall table / card grid).

export interface APIRequestCCTVOverviewList {
  road_code?: string
  contract_no?: string
  limit?: number
  page?: number
  sort?: string
  field?: string
  search?: string
}

export interface CCTVOverviewListItem {
  road: CctvRoadRef
  solution: CctvSolutionRef
  camera: CctvCameraCount
  project: CctvProjectRef
  is_warranty: boolean
}

export interface APIResponseCCTVOverviewList {
  res_data: CCTVOverviewListItem[]
  meta_data: MetaData
}

/** Flattened row for the overall table — a solution row tagged with the
 *  sub-department (แขวง) it belongs to, so the table can group by bureau. */
export interface CCTVOverviewRow extends CCTVOverviewListItem {
  bureau: string
}

// ── GET /cctv/departments/{id}/overview/totals ────────────────────────────────
// Stat cards: camera online/offline + warranty active/expired.

export interface APIResponseCCTVOverviewTotals {
  camera: CctvCameraCount
  warranty: CctvWarrantyCount
}

// ── GET /cctv/departments/{id}/overview/dropdowns ─────────────────────────────

export interface APIRequestCCTVOverviewDropdowns {
  road_code?: string
  contract_no?: string
}

export interface APIResponseCCTVOverviewDropdowns {
  road_code: string[]
  contract_no: string[]
}

// ── GET /cctv/departments/{id}/overview/central/list ──────────────────────────
// Bureau-aware nested tree (bureau → sub-departments → solutions). No paging.

export interface CCTVOverviewCentralDept {
  department_id: number
  department_short_name: string
  solutions: CCTVOverviewListItem[]
}

export interface CCTVOverviewCentralItem {
  department_id: number
  department_short_name: string
  sub_department: CCTVOverviewCentralDept[]
}

export type APIResponseCCTVOverviewCentralList = CCTVOverviewCentralItem[]

// ── GET /cctv/departments/{id}/overview/central/totals ────────────────────────
// Same shape as overview/totals, aggregated across the bureau's group.

export type APIResponseCCTVOverviewCentralTotals = APIResponseCCTVOverviewTotals

// NEW
export interface APIRequestCCTVOverviewCentralList {
  scope?: string
  road_id?: number
}

export type APIRequestCCTVOverviewCentralTotals = APIRequestCCTVOverviewCentralList