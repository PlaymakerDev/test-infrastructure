import type { OverviewCentralItem } from '@/types/lighting'

export type WarrantyStatus = 'in-warranty' | 'expired' | 'unknown'
export type ConnectionStatus = 'online' | 'offline' | 'unknown'
export type LineStatus = 'normal' | 'abnormal' | 'unknown'
export type CircuitStatus = 'normal' | 'abnormal' | 'unknown'
export type LightingPhase = 1 | 3

export interface TrafficLightingProject {
  id: string
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
  let fallbackSequence = 0

  for (const bureau of items) {
    for (const department of bureau.sub_department ?? []) {
      for (const solution of department.solutions ?? []) {
        const imei = solution.imei?.trim() ?? ''
        const lighting = solution.lighting

        projects.push({
          id: imei || `${solution.solution.id}-${fallbackSequence++}`,
          imei: imei || undefined,
          roadCode: solution.road.code_name ?? '-',
          projectName: solution.project.project_name ?? solution.solution.solution_name ?? '-',
          installPoint: solution.solution.solution_name ?? '-',
          contractNo: solution.project.contract_no ?? '-',
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
