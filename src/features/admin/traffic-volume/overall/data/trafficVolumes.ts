// UI DTO for the Traffic Volume overall-page table row. Produced by the
// `apiSolutionToProject` adapter in DataDisplayTrafficVolume.tsx — the
// backend wire format (CountingCentralSolution) is reshaped into this
// flatter shape that the tables, summary table, and detail navigation
// all read from.

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
