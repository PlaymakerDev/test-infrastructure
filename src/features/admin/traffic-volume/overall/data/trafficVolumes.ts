// UI DTO for the Traffic Volume overall-page table row. Produced by the
// `apiSolutionToProject` adapter in DataDisplayTrafficVolume.tsx — the
// backend wire format (CountingCentralSolution) is reshaped into this
// flatter shape that the tables, summary table, and detail navigation
// all read from.

import type { APIResponseTrafficVolumeCentralList } from '@/types/traffic-volume/overview-api'

// The backend has been observed returning the same solution nested under two
// different department nodes in one central/list response (same class of
// bug documented for incident-detection's central/list). Table rows key off
// solution.id alone (not department-scoped), so an unguarded duplicate
// crashes into a React "duplicate key" warning and silently doubles up
// export rows / inflates list-derived counts. Dedupe once, keeping the
// first occurrence — shared by DataDisplayTrafficVolume (table/export) and
// InfoCardTrafficVolume (active-by-warranty tally) so both agree.
export const dedupeTrafficVolumeSolutions = (
  bureaus: APIResponseTrafficVolumeCentralList
): APIResponseTrafficVolumeCentralList => {
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
export type StationType = 'Permanent' | 'Mobile'

export interface TrafficVolumeProject {
  /** Solution id — what `/counting/details/{id}` is keyed by. */
  id: string
  /** Project / contract entity id — used by Project Info modal. */
  projectId?: string
  /** Road entity id — resolves responsible department. */
  roadId?: string
  /** รหัสสายทาง เช่น "กท.1001" */
  roadCode: string
  /** ชื่อโครงการเต็ม — central-list API does not return this; optional. */
  projectName?: string
  /** จุดติดตั้ง — populated from `solution.solution_name` when adapting API rows. */
  installPoint: string
  /** เลขที่สัญญา */
  contractNo: string
  /** ปีงบประมาณ (พ.ศ.) — shown in the เลขที่สัญญา column when contractNo is empty. */
  budgetYear?: number
  warranty: WarrantyStatus
  connection: ConnectionStatus
  /** True when at least one camera under the solution is online. */
  stream: boolean
  /** ประเภทสถานี — not exposed by the central-list endpoint. */
  stationType?: StationType
  /** สำนัก (top-level org unit) — projects are grouped by this in the table. */
  bureau: string
  /** [lng, lat] for map marker — central-list has no coords. */
  coord?: [number, number]
  // ── Counts (summary view) ──────────────────────────────────────────────
  /** จำนวนเครื่องนับ/เซ็นเซอร์ทั้งหมด */
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  // ── Live values ────────────────────────────────────────────────────────
  /** ปริมาณจราจร (คัน) — from `traffic_count` on the central-list endpoint. */
  trafficCount?: number
}
