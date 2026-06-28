// Traffic Signal — Detail page API types
// Source: drr-cm-fe/types/traffic/api.ts (verified against backend usage)

import type { MetaData } from '../shared'

// ── 8. GET /manage/contract/{id} ──────────────────────────────────────────────
// Project info — used in TitleSection (name, contract no, warranty dates).

export interface APIResponseTrafficContractInfo {
  id: number
  project_name: string
  contract_no: string
  department_name: string
  warranty_start_date: string
  warranty_end_date: string
  company_name: string
  /** 3-state warranty label from BE — e.g. "ในค้ำ" | "หมดค้ำ" | "ก่อนค้ำ".
   *  Verified live (GET /manage/contract/{id}) 2026-06-23. */
  warranty_status: string
  /** Pre-formatted warranty period string for display. */
  warranty_date: string
}

// ── 9. GET /manage/solution/details/{id} ──────────────────────────────────────
// Solution-level metadata — the canonical "what is this solution?" record.
// Feeds the title bar (anydesk button, solution name) and the detail map
// (`geometry_point` is the source of truth for coordinates).

export interface APIResponseTrafficSolutionDetail {
  id: number
  solution_location_id: number
  solution_type_id: number
  /** Station/km marker, e.g. "7+200" */
  sta: string
  /** Full display name, e.g. "ชม.3038 กม. 7+200" */
  solution_name: string
  ip_address: string
  zt_ip_address: string
  /** [lng, lat] — coordinates for the detail-page map marker. */
  geometry_point: [number, number] | null
  remarks: string
  /** Empty string means "no AnyDesk configured" — render no button. */
  anydesk: number | string | null
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string | null
}

// ── 10. GET /traffic/details/{id} ─────────────────────────────────────────────
// Main detail data — feeds the 4 InfoCards (mode / efficiency / PCU / peak).
// Backend returns an array; the first element is the current traffic state.

export interface TrafficDetailsItem {
  traffic_id: number
  controller_mode: string
  efficiency: number
  total_pcu: number
  max_active_time: number
  max_active_phase: number
  total_phases: number
}

export type APIResponseTrafficDetails = TrafficDetailsItem[]

// ── 11. GET /traffic/details/phase_details/{id} ───────────────────────────────
// Per-phase timing — feeds the Phase Timing card + Traffic Cycle donut.

export interface TrafficPhaseDetail {
  id: number
  traffic_id: number
  phase_no: number
  cycle_id: number
  green_time: number
  waiting_time: number
  remaining_queue: number
  intitial_queue: number      // typo preserved from API spec
  vehicle_cleared: number
  is_early_termination: boolean
  time_save: number
  is_main_road: boolean
  efficiency: number
  timestamp: string
  is_active: boolean
}

export type APIResponseTrafficPhaseDetails = TrafficPhaseDetail[]

// ── 12. GET /traffic/details/cameras/{id} ─────────────────────────────────────
// All cameras attached to the solution (8 typical: 4 Counting + 4 StopLine).

export interface TrafficSolutionCamera {
  camera_id: string
  camera_name: string
  hls_url: string
  camera_type: 'Counting' | 'StopLine' | null
  ip_address: string
  total_count: number
  is_online: boolean
  phases_no: number
}

export type APIResponseTrafficSolutionCameras = TrafficSolutionCamera[]

// ── 13. GET /traffic/details/graph/{id} ───────────────────────────────────────
// Charts for Tab 1 bottom row (per OpenAPI `GraphTrafficResponse`):
//   • `traffic_pcu` — 24h volume per phase
//   • `efficentcy.graph` — real-time efficiency per phase per hour (note typo)
//   • `saving.graph` — ET rate / time saved / CO2 saved per hour (TOP-LEVEL,
//      not nested under efficentcy as our old type assumed)

export interface TrafficGraphPcuPoint {
  phases_no: number
  hour_timestamp: string
  total_pcu: number
  [key: string]: unknown
}

export interface TrafficEfficiencyGraphPoint {
  phase_no?: number
  phases_no?: number
  hour_timestamp: string
  efficiency: number
}

export interface TrafficEfficiencySavingPoint {
  hour_timestamp: string
  early_termination_rate: number
  total_time_saved: number
  carbon_saved: number
}

export interface TrafficEfficiencySaving {
  graph: TrafficEfficiencySavingPoint[]
  early_termination_rate: number
  total_time_saved: number
  total_carbon_saved: number
}

export interface TrafficEfficiencyData {
  graph: TrafficEfficiencyGraphPoint[]
  phases_label: string[]
  phases_avg: number[]
  /** Legacy nested location — kept for backward compat. Prefer the top-level
   *  `APIResponseTrafficGraph.saving` matching the current OpenAPI spec. */
  saving?: TrafficEfficiencySaving
}

export interface APIResponseTrafficGraph {
  traffic_pcu: TrafficGraphPcuPoint[]
  /** Note: backend uses the typo `efficentcy` (without the second `i`). The
   *  alternate spelling is here for older snapshots that used `efficiency`. */
  efficentcy?: TrafficEfficiencyData
  efficiency?: TrafficEfficiencyData
  /** Top-level per OpenAPI spec. Some older payloads nested this inside
   *  `efficentcy.saving` — the charts read both for safety. */
  saving?: TrafficEfficiencySaving
}

// ── 14. GET /traffic/details/summary/{id}?date=YYYY-MM-DD ─────────────────────
// 7-day summary — feeds Tab 2 daily cards + the 4 bar charts.

export interface APIRequestTrafficSummary {
  date: string // YYYY-MM-DD — end date of the 7-day window
}

export interface TrafficSummaryPhase {
  phase_string: string
  phase_no: number
  pcu: number
}

export interface TrafficSummaryDay {
  date: string
  day: string
  total_pcu: number
  peak_phase: number
  phases: TrafficSummaryPhase[]
  avg_efficiency: number
  avg_early_termination: number
  total_time_saved: number
  total_carbon_saved: number
}

export type APIResponseTrafficSummary = TrafficSummaryDay[]

// ── 15. GET /traffic/details/reports/{id} ─────────────────────────────────────
// Paginated 7-day table data — feeds Tab 2 table.

export interface APIRequestTrafficReports {
  page?: number
  limit?: number
  start_date?: string
  end_date?: string
}

export interface TrafficReportPhaseData {
  phases_no: number
  total_pcu: number
  avg_green_time: number
  avg_waithing_time: number     // typo preserved from API spec
  total_time_saved: number
  total_carbon_saved: number
  efficiency: number
}

export interface TrafficReportItem {
  date: string
  day: string
  data: TrafficReportPhaseData[]
}

export interface APIResponseTrafficReports {
  res_data: TrafficReportItem[]
  meta_data: MetaData
}
