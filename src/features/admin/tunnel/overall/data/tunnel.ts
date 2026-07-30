// UI DTO for the Tunnel overall-page table row. Produced by the
// `apiSolutionToProject` adapter in DataDisplaySection.tsx — the backend
// wire format (TunnelCentralSolution) is reshaped into this flatter
// shape that the table and grid both read from.

import type { APIResponseTunnelCentralList } from '@/types/tunnel/overview-api'

// The backend has been observed returning the same solution nested under two
// different department nodes in one central/list response (same class of
// bug documented for incident-detection's central/list). Table rows key off
// solution.id alone (not department-scoped), so an unguarded duplicate
// crashes into a React "duplicate key" warning and silently doubles up
// export rows / inflates list-derived counts. Dedupe once, keeping the
// first occurrence — shared by DataDisplaySection (table/grid/export) and
// InfoCardSection (active-by-warranty tally) so both agree.
export const dedupeTunnelSolutions = (
  bureaus: APIResponseTunnelCentralList
): APIResponseTunnelCentralList => {
  const seen = new Set<number | string>()
  return (bureaus ?? []).map((bureau) => ({
    ...bureau,
    sub_department: (bureau?.sub_department ?? []).map((sub) => ({
      ...sub,
      solutions: (sub?.solutions ?? []).filter((sol) => {
        if (!sol) return false
        if (seen.has(sol.solution.id)) return false
        seen.add(sol.solution.id)
        return true
      }),
    })),
  }))
}

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'

export interface TunnelProject {
  /** Solution id — what `/tunnel/details/{id}` is keyed by. */
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
  /** อุโมงค์ online/offline — derived from `tunnel.is_online`. */
  connection: ConnectionStatus
  /** สำนัก (top-level org unit) — projects are grouped by this in the table. */
  bureau: string
  // ── Camera counts ──────────────────────────────────────────────────────
  totalCameras: number
  onlineCount: number
  offlineCount: number
  // ── Tunnel device counts ───────────────────────────────────────────────
  /** จำนวนไฟส่องสว่างในอุโมงค์ — from `tunnel.lighting_count`. */
  totalLighting: number
  /** Token-signed URL that opens the tunnel's live control dashboard.
   *  Row clicks target this instead of the local `/admin/tunnel/detail/`. */
  tunnelUrl?: string
}
