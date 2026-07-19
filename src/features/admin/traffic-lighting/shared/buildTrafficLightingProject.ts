import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'

const PLACEHOLDER_PROJECT = (id: string, equipmentType: string | null): TrafficLightingProject => ({
  id,
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
