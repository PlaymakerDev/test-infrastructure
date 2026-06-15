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
}

// ── 9. GET /manage/solution/details/{id} ──────────────────────────────────────
// Solution-level metadata. We only need AnyDesk ID for the title bar button.

export interface APIResponseTrafficSolutionDetail {
  anydesk: number | null
  // Other fields present but unused — left untyped intentionally.
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
// Charts for Tab 1 bottom row:
//   • `traffic_pcu` — 24h volume per phase
//   • `efficiency.graph` — real-time efficiency per phase per hour
//   • `efficiency.saving` — ET rate / time saved / CO2 saved per hour

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
  saving?: TrafficEfficiencySaving
}

export interface APIResponseTrafficGraph {
  traffic_pcu: TrafficGraphPcuPoint[]
  // Note: backend typo (`efficientcy`) — accept both for safety.
  efficientcy?: TrafficEfficiencyData
  efficiency?: TrafficEfficiencyData
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
