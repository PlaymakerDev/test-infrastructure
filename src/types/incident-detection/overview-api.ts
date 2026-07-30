// Incident Detection (เดิมชื่อ "Analytic") — Overview (solution-level) API types.
// Backend namespace: /analytic/departments/{deptId}/...  — mirrors the CCTV API
// surface (overview / totals / central-list / list), with analytic-specific
// fields (`events_count`). Camera-level types live in `camera-api.ts`.

import type { MetaData } from '../shared'

// ── Shared sub-shapes ─────────────────────────────────────────────────────────

export interface IncidentRoadRef {
  id: number
  code_name: string
}

export interface IncidentSolutionRef {
  id: number
  solution_name: string
}

export interface IncidentProjectRef {
  id: number
  project_name: string
  budget_year: number
  contract_no: string
}

// ── GET /analytic/departments/{id}/overview ───────────────────────────────────
// Map markers (one per solution) + centroid. Carries a single `is_online` and
// the incident `events_count` per solution.

export interface IncidentOverviewLocation {
  solution: IncidentSolutionRef
  road: IncidentRoadRef
  camera: { total: number; is_online: boolean; events_count: number }
  last_updated: string
  /** Nullable — some solutions have no mapped coordinate. */
  geometry_point: [number, number] | null
}

export interface APIResponseIncidentOverview {
  locations: IncidentOverviewLocation[]
  centroid: [number, number] | null
}

export interface APIRequestIncidentOverview {
  solution_id?: number | string
  road_code?: string
  contract_no?: string
  road_id?: number
}

// ── GET /analytic/departments/{id}/overview/totals ────────────────────────────

export interface APIResponseIncidentTotals {
  camera: { total: number; online: number; offline: number }
  warranty: { active: number; expired: number }
}

// ADDED
export interface APIRequestIncidentTotals {
  scope?: string
  road_id?: number
  start_date?: string
  end_date?: string
}

// ── GET /analytic/departments/{id}/overview/central/list ──────────────────────
// Bureau → sub-department(แขวง) → solutions tree. Table source (grouped by แขวง).
// NOTE: the `camera` object is INCONSISTENT across solutions (verified live
// 2026-06-23): some carry `online_count` only, some `offline_count` only, some
// both. BOTH counts are therefore optional — derive the missing one from
// `total` (online = total - offline, and vice-versa).

export interface IncidentCentralSolution {
  road: IncidentRoadRef
  project: IncidentProjectRef
  solution: IncidentSolutionRef
  camera: { total: number; online_count?: number; offline_count?: number; events_count: number }
  is_warranty: boolean
  /** [lng, lat] — null when this solution has no mapped coordinate. Verified
   *  live 2026-07-09 (was previously missing; the map used a separate
   *  /overview?scope=all call joined by solution.id — no longer needed). */
  geometry_point: [number, number] | null
  /** Notification count for this solution. Verified live 2026-07-09. */
  noti_count: number
}

export interface IncidentCentralDept {
  department_id: number
  department_short_name: string
  solutions: IncidentCentralSolution[]
}

export interface IncidentCentralItem {
  department_id: number
  department_short_name: string
  sub_department: IncidentCentralDept[]
}

export type APIResponseIncidentCentralList = IncidentCentralItem[]

// ADDED
export type APIRequestIncidentCentralList = APIRequestIncidentTotals

// ── GET /analytic/departments/{id}/overview/list ──────────────────────────────
// Flat paginated list (has `offline_count` directly).

export interface APIRequestIncidentList {
  road_code?: string
  contract_no?: string
  page?: number
  limit?: number
  search?: string
}

export interface IncidentListItem {
  road: IncidentRoadRef
  project: IncidentProjectRef
  solution: IncidentSolutionRef
  camera: { total: number; online_count: number; offline_count: number; events_count: number }
  is_warranty: boolean
}

export interface APIResponseIncidentList {
  res_data: IncidentListItem[]
  meta_data: MetaData
}
