// UI DTO for the Traffic Volume overall-page table row. Produced by the
// `apiSolutionToProject` adapter in DataDisplayTrafficVolume.tsx — the
// backend wire format (CountingCentralSolution) is reshaped into this
// flatter shape that the tables, summary table, and detail navigation
// all read from.

import type { APIResponseTrafficVolumeCentralList, CountingCentralSolution } from '@/types/traffic-volume/overview-api'
import { joinRoadCodes, mergeSolutionRows } from '@/features/admin/traffic-volume/shared/utils/mergeSolutionRows'

/** Two rows of one install point — its cameras on two roads — as one: each
 *  counts its own cameras (and their vehicles), so the counts add up. */
const mergeTrafficVolumeRows = (into: CountingCentralSolution, row: CountingCentralSolution): CountingCentralSolution => ({
  ...into,
  road: { ...into.road, code_name: joinRoadCodes(into.road.code_name, row.road.code_name) },
  camera: {
    total: into.camera.total + row.camera.total,
    is_online: into.camera.is_online || row.camera.is_online,
    count: into.camera.count + row.camera.count,
  },
  online_count: into.online_count + row.online_count,
  offline_count: into.offline_count + row.offline_count,
})

// The backend lists an install point once per road its cameras stand on, so
// one solution can come back as several rows (see mergeSolutionRows). Table
// rows key off solution.id alone, so each install point must be one row — one
// carrying ALL its cameras (dropping the later rows hid cameras: 520 showed 2
// of 3). Shared by DataDisplayTrafficVolume (table/export), InfoCardTrafficVolume
// (active-by-warranty tally) and the detail title so all agree.
export const mergeTrafficVolumeSolutions = (bureaus: APIResponseTrafficVolumeCentralList): APIResponseTrafficVolumeCentralList =>
  mergeSolutionRows(bureaus, mergeTrafficVolumeRows)

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
