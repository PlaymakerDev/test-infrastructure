// Types + mapper for Traffic Lighting projects. The overall table sources
// every row from /overview/central/list (see mapCentralListToProjects) —
// no static mock data lives here anymore.

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'
export type LineStatus = 'normal' | 'abnormal'
export type CircuitStatus = 'normal' | 'abnormal'
export type LightingPhase = 1 | 3

export interface TrafficLightingProject {
  id: string
  /** รหัสสายทาง เช่น "นย.2024" */
  roadCode: string
  projectName: string
  installPoint: string
  contractNo: string
  warranty: WarrantyStatus
  connection: ConnectionStatus
  phase: LightingPhase
  lineStatus: LineStatus
  circuitStatus: CircuitStatus
  /** สำนัก — projects are grouped by this in the table. */
  bureau: string
  /** [lng, lat] for map marker */
  coord: [number, number]
  /** Equipment on this solution — drives which detail layout to show. */
  equipment: { count: number | null; type: string | null }
}


/** Map a /overview/central/list response into the table's TrafficLightingProject[] shape.
 *  Each solution becomes one row; bureau = top-level department_short_name. */
import type { OverviewCentralItem } from '@/types/lighting'

export const mapCentralListToProjects = (
  items: OverviewCentralItem[],
): TrafficLightingProject[] => {
  const out: TrafficLightingProject[] = []
  // Several IMEIs can share one solution_id (e.g. solution 1910 → 8 devices),
  // so we key rows by imei when present and fall back to solution_id. A
  // running counter guarantees uniqueness even for empty-imei rows.
  let seq = 0
  for (const bureau of items) {
    for (const sub of bureau.sub_department ?? []) {
      for (const sol of sub.solutions ?? []) {
        const equip = sol.lighting?.equipment
        // Phase is only meaningful for "phase" cabinets; lamp arrays show '-'.
        const phase: LightingPhase = equip?.type === 'phase' ? 3 : 3
        const imei = sol.imei ?? ''
        out.push({
          id: imei || `${sol.solution.id}-${seq++}`,
          roadCode: sol.road?.code_name ?? '-',
          projectName: sol.project?.project_name ?? sol.solution?.solution_name ?? '-',
          installPoint: sol.solution?.solution_name ?? '-',
          contractNo: sol.project?.contract_no ?? '-',
          warranty: sol.is_warranty ? 'in-warranty' : 'expired',
          connection: sol.lighting?.is_online ? 'online' : 'offline',
          phase,
          // line/circuit status aren't in central/list — keep 'normal' as a
          // neutral default; the detail screen reads them per-IMEI.
          lineStatus: 'normal',
          circuitStatus: sol.lighting?.has_broken_wire ? 'abnormal' : 'normal',
          bureau: bureau.department_short_name ?? '-',
          coord: sol.GeometryPoint ?? [0, 0],
          equipment: { count: equip?.count ?? null, type: equip?.type ?? null },
        })
      }
    }
  }
  return out
}
