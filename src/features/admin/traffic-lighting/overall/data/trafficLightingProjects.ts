import type { OverviewCentralItem } from '@/types/lighting'

export type WarrantyStatus = 'in-warranty' | 'expired' | 'unknown'
export type ConnectionStatus = 'online' | 'offline' | 'unknown'
export type LineStatus = 'normal' | 'abnormal' | 'unknown'
export type CircuitStatus = 'normal' | 'abnormal' | 'unknown'
export type LightingPhase = 1 | 3

export interface TrafficLightingProject {
  id: string
  /** React key of the row. `id` is the device's IMEI and the central list can
   *  carry one device twice (sol 5296 "รย.4010 ตู้ที่ 2" — two identical rows,
   *  2026-10-26); two table rows sharing a key left stale rows on screen,
   *  without their road-code cell, once a search changed the list. A repeat
   *  gets `~2`, `~3`, … — `id` itself stays the IMEI the detail link needs. */
  rowKey: string
  /** Real device IMEI. Absent when the central list only identifies a solution. */
  imei?: string
  roadCode: string
  projectName: string
  installPoint: string
  contractNo: string
  warranty: WarrantyStatus
  connection: ConnectionStatus
  phase: LightingPhase | null
  lineStatus: LineStatus
  circuitStatus: CircuitStatus
  bureau: string
  /** [lng, lat] for the map marker. */
  coord: [number, number]
  equipment: { count: number | null; type: string | null }
  /** Raw `lighting.has_broken_wire` from central/list — backs the สถานะสาย badge. */
  hasBrokenWire?: boolean | null
  roadId?: number
  solutionId?: number
  projectId?: number
  budgetYear?: number
}

/** Map the central-list response into the view model used by map, grid and table. */
export const mapCentralListToProjects = (
  items: OverviewCentralItem[],
): TrafficLightingProject[] => {
  const projects: TrafficLightingProject[] = []
  const keyUses = new Map<string, number>()
  let fallbackSequence = 0

  for (const bureau of items) {
    for (const department of bureau.sub_department ?? []) {
      for (const solution of department.solutions ?? []) {
        const imei = solution.imei?.trim() ?? ''
        const lighting = solution.lighting
        const id = imei || `${solution.solution.id}-${fallbackSequence++}`
        const uses = (keyUses.get(id) ?? 0) + 1
        keyUses.set(id, uses)

        projects.push({
          id,
          rowKey: uses === 1 ? id : `${id}~${uses}`,
          imei: imei || undefined,
          roadCode: solution.road.code_name ?? '-',
          projectName: solution.project.project_name ?? solution.solution.solution_name ?? '-',
          installPoint: solution.solution.solution_name ?? '-',
          // Empty (not '-') so ContractInfoCell can fall back to the budget year.
          contractNo: solution.project.contract_no ?? '',
          warranty: solution.is_warranty ? 'in-warranty' : 'expired',
          connection: lighting.is_online ? 'online' : 'offline',
          // Phase and line state are not included in central/list. They are
          // populated only by the per-IMEI detail response.
          phase: null,
          lineStatus: 'unknown',
          circuitStatus: lighting.has_broken_wire ? 'abnormal' : 'normal',
          bureau: bureau.department_short_name ?? '-',
          coord: solution.GeometryPoint ?? [0, 0],
          equipment: {
            count: lighting.equipment.count ?? null,
            type: lighting.equipment.type ?? null,
          },
          hasBrokenWire: lighting.has_broken_wire ?? null,
          roadId: solution.road.id,
          solutionId: solution.solution.id,
          projectId: solution.project.id,
          budgetYear: solution.project.budget_year,
        })
      }
    }
  }

  return projects
}
