// Type-only file: the BridgeLighting overall table renders from real API
// data (bridge_lighting overview). No static rows live here anymore.

import type { APIResponseBridgeLightingList } from '@/types/bridge-lighting/overall-api'

// The backend has been observed returning the same solution nested under two
// different department nodes in one central/list response (same class of
// bug documented for incident-detection's central/list). Table rows key off
// solution.id alone (not department-scoped), so an unguarded duplicate
// crashes into a React "duplicate key" warning and silently doubles up
// export rows / inflates list-derived counts. Dedupe once, keeping the
// first occurrence — shared by DataDisplaySection (table/grid/export) and
// InfoCardSection (active-by-warranty tally) so both agree.
export const dedupeBridgeLightingSolutions = (
  depts: APIResponseBridgeLightingList
): APIResponseBridgeLightingList => {
  const seen = new Set<number | string>()
  return (depts ?? []).map((dept) => ({
    ...dept,
    sub_department: (dept.sub_department ?? []).map((sub) => ({
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

export interface BridgeProject {
  id: string
  /** รหัสสายทาง เช่น "ชร.5051" */
  roadCode: string
  /** ชื่อโครงการเต็ม */
  projectName: string
  /** จุดติดตั้ง เช่น "ไฟประดับ : สะพานขัวพญามังราย" */
  installPoint: string
  /** เลขที่สัญญา เช่น "ขทช.ชร./49/2568" */
  contractNo: string
  warranty: WarrantyStatus
  connection: ConnectionStatus
  stream: boolean
  /** สำนัก (top-level org unit) — projects are grouped by this in the table.
   *  Examples: "ส่วนกลาง", "สทช.ที่ 17 เชียงราย", "สทช.ที่ 2 สระบุรี". */
  bureau: string
  /** [lng, lat] for map marker */
  coord: [number, number]
  // ── Counts for the summary view ───────────────────────────────────────────
  /** จำนวนดวงไฟทั้งหมดในโครงการ */
  totalDevices: number
  /** จำนวนที่ออนไลน์ */
  onlineCount: number
  /** จำนวนที่ออฟไลน์ */
  offlineCount: number
  // ── Detail page data ──────────────────────────────────────────────────────
  /** Anydesk remote-access ID for the control PC */
  anydesk: string
  /** สถานะการทำงานล่าสุด เช่น "เปิดไฟประดับสะพาน" / "ปิดไฟประดับสะพาน" */
  statusText: string
  /** Timestamp string of last update for status */
  lastUpdate: string
  /** Electrical readings — voltage per phase (V) */
  voltage: { avg: number; p1: number; p2: number; p3: number }
  /** Electrical readings — current per phase (A) */
  current: { total: number; p1: number; p2: number; p3: number }
}


