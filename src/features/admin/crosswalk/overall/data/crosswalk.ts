// UI DTO for the Crosswalk overall-page table row. Produced by the
// `apiSolutionToProject` adapter in DataDisplaySection.tsx — the backend
// wire format (CrosswalkCentralSolution) is reshaped into this flatter
// shape that the table and grid both read from.

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'

export interface CrosswalkProject {
  /** Solution id — what `/crosswalk/details/{id}` is keyed by. */
  id: string
  /** Project / contract entity id — used by Project Info modal. */
  projectId?: string
  /** Road entity id — resolves responsible department. */
  roadId?: string
  /** รหัสสายทาง เช่น "ชม.2025" */
  roadCode: string
  /** ชื่อโครงการเต็ม */
  projectName?: string
  /** จุดติดตั้ง — populated from `solution.solution_name`. */
  installPoint: string
  /** เลขที่สัญญา */
  contractNo: string
  /** ปีงบประมาณ (พ.ศ.) — shown when contractNo is empty. */
  budgetYear?: number
  warranty: WarrantyStatus
  /** ทางข้าม online/offline — derived from `crosswalk.is_online`. */
  connection: ConnectionStatus
  /** สำนัก (top-level org unit) — projects are grouped by this in the table. */
  bureau: string
  // ── Camera counts ──────────────────────────────────────────────────────
  totalCameras: number
  onlineCount: number
  offlineCount: number
  // ── Crosswalk device counts ────────────────────────────────────────────
  totalCrosswalks: number
}
