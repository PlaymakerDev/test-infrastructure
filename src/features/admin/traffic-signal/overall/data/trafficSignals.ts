// Mock data — โครงการสัญญาณไฟจราจรในระบบ
// Used by the Traffic Signal screen (camera list + map markers + table).

import type { WarrantyStatusString } from '@/types/shared'
import type { APIResponseTrafficCentralList } from '@/types/traffic-signal/overview-api'

// The backend has been observed returning the same solution nested under two
// different department nodes in one central/list response (same class of
// bug documented for incident-detection's central/list). Table rows key off
// solution.id alone (not department-scoped), so an unguarded duplicate
// crashes into a React "duplicate key" warning and silently doubles up
// export rows / inflates list-derived counts. Dedupe once, keeping the
// first occurrence — shared by DataDisplayTrafficSignal (table/export) and
// InfoCardTrafficSignal (active-by-warranty tally) so both agree.
export const dedupeTrafficSignalSolutions = (
  bureaus: APIResponseTrafficCentralList
): APIResponseTrafficCentralList => {
  const seen = new Set<number | string>()
  return bureaus.map((bureau) => ({
    ...bureau,
    sub_department: (bureau.sub_department ?? []).map((sub) => ({
      ...sub,
      solutions: (sub.solutions ?? []).filter((sol) => {
        if (seen.has(sol.solution.id)) return false
        seen.add(sol.solution.id)
        return true
      }),
    })),
  }))
}

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'
/** Phase count of a junction — the raw `total_phases` the API reports.
 *  NOT narrowed to 3|4: production carries 0 (10 junctions, unconfigured), 5
 *  (1) and 8 (2) as well, and the old `3 | 4` type forced every one of them
 *  to display "4 Phase" (surveyed 2026-10-26). Treat 0 as "not configured". */
export type SignalPhase = number
export type OperatingMode = 'FixedTime' | 'Adaptive_ET' | 'Auto' | 'Flashing24Hr'

/** Shared phase color palette — used by the cycle donut, phase timing card,
 *  charts (24h volume, real-time bars), 7-day daily cards, and the summary
 *  table. Order corresponds to phase 1..N. Use `getPhaseColor(phase)` for
 *  bounds-safe access. */
export const PHASE_COLORS = ['#05F2DB', '#B2FF00', '#FCD116', '#FF7B00'] as const

export const getPhaseColor = (phase: number): string =>
  PHASE_COLORS[(phase - 1) % PHASE_COLORS.length]

/** Phase numbers a view should draw, taken from the rows the API actually
 *  returned instead of the junction's declared `total_phases`.
 *
 *  The two disagree on 10 junctions in production (surveyed 2026-10-26): some
 *  declare 4 phases but report data for only 1–3 (the extra series rendered as
 *  phantom "Phase 4 — 0"), others declare 0 yet report 3–4. The two datasets on
 *  ONE junction can disagree with each other too — solution 1582's efficiency
 *  graph carries 4 phases while its PCU graph carries 3 — so each view must
 *  call this with its own rows rather than share one count.
 *
 *  `declared` is the last-resort fallback for an empty response; 0 (the
 *  "unconfigured" value) yields an empty list so nothing phantom is drawn. */
export const phasesFromRows = (
  rows: readonly { phases_no?: number | null; phase_no?: number | null }[] | null | undefined,
  declared?: number,
): number[] => {
  const seen = new Set<number>()
  for (const row of rows ?? []) {
    const no = row.phases_no ?? row.phase_no
    if (typeof no === 'number' && no > 0) seen.add(no)
  }
  if (seen.size > 0) return [...seen].sort((a, b) => a - b)
  return declared && declared > 0
    ? Array.from({ length: declared }, (_, i) => i + 1)
    : []
}

/** `{ dataKey, color, label }` series config for the given phase numbers —
 *  the shape LineChart's `lines` and BarChart's `bars` both take. Keys match
 *  the `p{n}` fields the chart builders write. */
export const phaseSeries = (phases: readonly number[]) =>
  phases.map((no) => ({
    dataKey: `p${no}`,
    color: getPhaseColor(no),
    label: `Phase ${no}`,
  }))

/** A day's peak phase: BE's `peak_phase`, else the highest-PCU phase.
 *  BE's value IS that argmax on every day it sets one (511/511, surveyed
 *  2026-10-26), but it reports 0 on 28 days that carry PCU — all on junctions
 *  whose declared phase count is stale (e.g. 1611 declares 0 yet logs ~8,000
 *  PCU/day on phase 4). 0 = no peak (no phase with traffic). */
export const peakPhaseOf = (day: {
  peak_phase?: number | null
  phases?: readonly { phase_no: number; pcu: number }[] | null
}): number => {
  if (day.peak_phase && day.peak_phase > 0) return day.peak_phase
  let peak = 0
  let max = 0
  for (const p of day.phases ?? []) {
    if (p.pcu > max) {
      max = p.pcu
      peak = p.phase_no
    }
  }
  return peak
}

/** A phase's green time as "25s", or a dash when the phase feed has no row
 *  for it — a missing timing must not read as a measured zero-second green. */
export const fmtGreenTime = (sec: number | null | undefined): string =>
  sec == null ? '-' : `${sec}s`

/** Single phase timing config — used by the Phase Timing card + donut chart on
 *  the detail page. Mapped from `/traffic/details/phase_details/{id}`. */
export interface PhaseTimingConfig {
  /** Phase number (1–4) */
  phase: number
  /** Green-light duration (seconds) — `green_time`. Under early termination
   *  this is the configured green; the phase may end sooner. */
  greenSec: number
  /** Seconds from the cycle start until this phase turns green — BE's
   *  `waiting_time`: 0 for the first phase, then each earlier phase's green +
   *  a ~5s intergreen (verified 2026-10-26). An OFFSET, not a red duration. */
  redSec: number
  /** Whether this phase is the currently active one (green) per the live API.
   *  Exactly one phase should have this true at any time. Undefined on mock
   *  data — the component falls back to a local simulation in that case. */
  isActive?: boolean
  /** ISO start of the CURRENT CYCLE — every phase row of a junction carries
   *  the same value; it is NOT when this phase turned green. The active
   *  phase's green runs [redSec, redSec + greenSec) after it. */
  timestamp?: string
  /** Phase covers the main road. Maps to BE's `is_main_road`. Used by the
   *  Live Stream modal's "ประเภทถนน" cell (ถนนสายหลัก / ถนนสายรอง). */
  isMainRoad?: boolean
}

export interface TrafficSignalProject {
  /** Solution id — same value used by `/traffic/details/{id}` and the rest
   *  of the solution-scoped detail endpoints. Comes from `solution.id` on
   *  the list endpoint. */
  id: string
  /** Project / contract entity id — used by `/manage/contract/{project_id}`
   *  (Project Info modal). Comes from `project.id` on the list endpoint. */
  projectId?: string
  /** Road entity id — used by `/manage/departments/by-road?road_id={road_id}`
   *  (resolves the responsible department in Project Info modal). Comes from
   *  `road.id` on the list endpoint. */
  roadId?: string
  /** รหัสสายทาง เช่น "กท.1001" */
  roadCode: string
  /** ชื่อโครงการเต็ม */
  projectName: string
  /** จุดติดตั้ง */
  installPoint: string
  /** เลขที่สัญญา */
  contractNo: string
  /** ปีงบประมาณ (พ.ศ.) — shown in the เลขที่สัญญา column when contractNo is empty. */
  budgetYear?: number
  warranty: WarrantyStatus
  /** BE's authoritative warranty status — three states (ในค้ำ / หมดค้ำ / ก่อนค้ำ).
   *  Source for the detail-page warranty pill so the "ก่อนค้ำ" yellow state
   *  isn't lost behind the boolean `warranty` flag (which only encodes 2). */
  warrantyStatus?: WarrantyStatusString
  connection: ConnectionStatus
  stream: boolean
  phase: SignalPhase
  operatingMode: OperatingMode
  /** สำนัก (top-level org unit) — projects are grouped by this in the table. */
  bureau: string
  /** [lng, lat] for map marker */
  coord: [number, number]
  // ── Counts for the summary view (crosswalk-style table) ─────────────────
  /** จำนวนกล้องทั้งหมดในโครงการ */
  totalCameras: number
  /** จำนวนกล้องที่ออนไลน์ */
  onlineCameras: number
  /** จำนวนกล้องที่ออฟไลน์ */
  offlineCameras: number
  // ── Detail page metrics ─────────────────────────────────────────────────
  /** Anydesk ID shown in the title bar (e.g. "1194336831") */
  anydeskId?: string
  /** ประสิทธิภาพของระบบ (%) */
  efficiency?: number
  /** PCU ประจำวัน */
  dailyPCU?: number
  /** จำนวนรถในช่วงเร่งด่วน (peak hour) */
  peakHourTraffic?: number
  /** Phase ที่เป็น peak (เช่น 2 = "Phase 2 - Peak") */
  peakPhase?: number
  /** Phase timing config — array length = number of phases */
  phaseTiming?: PhaseTimingConfig[]
}

// (Removed dead mock arrays TRAFFIC_SIGNAL_PROJECTS / TRAFFIC_SIGNAL_CAMERAS +
//  getTrafficSignalById — all signal/camera data now comes from the live API.)
