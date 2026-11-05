import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'
import type { LightingSolutionDetail } from '@/types/lighting'

/** What the point's own record (`/lighting/solutions/{id}`) says, as a list
 *  row — for when this URL's department list does not hold the point (dept 0
 *  without scope=all lists nothing). Mirrors `mapCentralListToProjects`;
 *  the record has no position, so `coord` is left to the caller. */
export const lightingRowFromSolution = (
  detail: LightingSolutionDetail,
): Partial<TrafficLightingProject> => {
  const cabinet = detail.lighting?.iot ?? null
  const gateway = detail.lighting?.lora ?? null
  const online = cabinet?.is_online ?? gateway?.is_online
  return {
    imei: cabinet?.imei?.trim() || undefined,
    roadCode: detail.road?.road_code?.trim() || '-',
    projectName: detail.project?.project_name || detail.solution?.solution_name || '-',
    installPoint: detail.solution?.solution_name || '-',
    // Empty (not '-') so ContractInfoCell can fall back to the budget year.
    contractNo: detail.project?.contract_no ?? '',
    warranty: detail.project ? (detail.project.is_warranty ? 'in-warranty' : 'expired') : 'unknown',
    connection: online == null ? 'unknown' : online ? 'online' : 'offline',
    circuitStatus: cabinet ? (cabinet.has_broken_wire ? 'abnormal' : 'normal') : 'unknown',
    // A lamp point's lamps; a cabinet sends none — no count, not "0".
    equipment: { count: detail.lighting?.devices?.length || null, type: null },
    roadId: detail.road?.id,
    solutionId: detail.solution?.id,
    projectId: detail.project?.id,
    budgetYear: detail.project?.budget_year,
  }
}

const PLACEHOLDER_PROJECT = (id: string, equipmentType: string | null): TrafficLightingProject => ({
  id,
  rowKey: id,
  imei: undefined,
  roadCode: '-',
  projectName: '-',
  installPoint: '-',
  contractNo: '-',
  warranty: 'unknown',
  connection: 'unknown',
  phase: null,
  lineStatus: 'unknown',
  circuitStatus: 'unknown',
  bureau: '-',
  coord: [0, 0],
  equipment: { count: null, type: equipmentType },
})

/** Build a TrafficLightingProject from navigation context or an honest placeholder. */
export function buildTrafficLightingProject(
  id: string,
  row: Partial<TrafficLightingProject> | null | undefined,
  equipmentType?: string | null,
): TrafficLightingProject {
  const type = equipmentType ?? row?.equipment?.type ?? null

  if (row?.roadCode || row?.projectName || row?.installPoint) {
    return {
      id,
      rowKey: id,
      imei: row.imei,
      roadCode: row.roadCode ?? '-',
      projectName: row.projectName ?? '-',
      installPoint: row.installPoint ?? '-',
      contractNo: row.contractNo ?? '-',
      warranty: row.warranty ?? 'unknown',
      connection: row.connection ?? 'unknown',
      phase: row.phase ?? null,
      lineStatus: row.lineStatus ?? 'unknown',
      circuitStatus: row.circuitStatus ?? 'unknown',
      bureau: row.bureau ?? '-',
      coord: row.coord ?? [0, 0],
      equipment: {
        count: row.equipment?.count ?? null,
        type: type ?? row.equipment?.type ?? null,
      },
      roadId: row.roadId,
      solutionId: row.solutionId,
      projectId: row.projectId,
      budgetYear: row.budgetYear,
    }
  }

  return PLACEHOLDER_PROJECT(id, type)
}
