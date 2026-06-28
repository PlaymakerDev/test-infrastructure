// Mock data — โครงการสัญญาณไฟจราจรในระบบ
// Used by the Traffic Signal screen (camera list + map markers + table).

import type { WarrantyStatusString } from '@/types/shared'

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'
export type SignalPhase = 3 | 4
export type OperatingMode = 'FixedTime' | 'Adaptive_ET' | 'Auto' | 'Flashing24Hr'

/** Shared phase color palette — used by the cycle donut, phase timing card,
 *  charts (24h volume, real-time bars), 7-day daily cards, and the summary
 *  table. Order corresponds to phase 1..N. Use `getPhaseColor(phase)` for
 *  bounds-safe access. */
export const PHASE_COLORS = ['#05F2DB', '#B2FF00', '#FCD116', '#FF7B00'] as const

export const getPhaseColor = (phase: number): string =>
  PHASE_COLORS[(phase - 1) % PHASE_COLORS.length]

/** Single phase timing config — used by the Phase Timing card + donut chart on
 *  the detail page. Sum of all phases' (green + red) = full cycle (e.g. 240s). */
export interface PhaseTimingConfig {
  /** Phase number (1–4) */
  phase: number
  /** Green-light duration (seconds) */
  greenSec: number
  /** Red-light duration before next phase (seconds) */
  redSec: number
  /** Whether this phase is the currently active one (green) per the live API.
   *  Exactly one phase should have this true at any time. Undefined on mock
   *  data — the component falls back to a local simulation in that case. */
  isActive?: boolean
  /** ISO timestamp at which this phase became active. Used to compute the
   *  elapsed time in this phase (now − timestamp) so the countdown survives
   *  page refresh / navigation. */
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
