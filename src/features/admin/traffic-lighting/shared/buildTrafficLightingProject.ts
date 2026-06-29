import {
  getTrafficLightingById,
  type TrafficLightingProject,
} from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'

const PLACEHOLDER_PROJECT = (id: string, equipmentType: string | null): TrafficLightingProject => ({
  id,
  roadCode: '-',
  projectName: '-',
  installPoint: '-',
  contractNo: '-',
  warranty: 'expired',
  connection: 'offline',
  phase: 3,
  lineStatus: 'normal',
  circuitStatus: 'normal',
  bureau: '-',
  coord: [100.5, 13.75],
  equipment: { count: null, type: equipmentType },
})

/** Build a TrafficLightingProject from stashed row context, mock lookup, or placeholder. */
export function buildTrafficLightingProject(
  id: string,
  row: Partial<TrafficLightingProject> | null | undefined,
  equipmentType?: string | null,
): TrafficLightingProject {
  const type = equipmentType ?? row?.equipment?.type ?? null

  if (row?.roadCode || row?.projectName || row?.installPoint) {
    return {
      id,
      roadCode: row.roadCode ?? '-',
      projectName: row.projectName ?? '-',
      installPoint: row.installPoint ?? '-',
      contractNo: row.contractNo ?? '-',
      warranty: row.warranty ?? 'expired',
      connection: row.connection ?? 'offline',
      phase: row.phase ?? 3,
      lineStatus: row.lineStatus ?? 'normal',
      circuitStatus: row.circuitStatus ?? 'normal',
      bureau: row.bureau ?? '-',
      coord: row.coord ?? [100.5, 13.75],
      equipment: {
        count: row.equipment?.count ?? null,
        type: type ?? row.equipment?.type ?? null,
      },
    }
  }

  return getTrafficLightingById(id) ?? PLACEHOLDER_PROJECT(id, type)
}
