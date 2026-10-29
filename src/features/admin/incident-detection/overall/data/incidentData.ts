// UI row shape for the Incident Detection overall tables (Tab1 summary + Tab2
// detail). Flattened from /analytic …/overview/central/list, tagged with its
// sub-department (แขวง) so the tables can group by bureau like traffic-signal.

import type { APIResponseIncidentCentralList, IncidentCentralSolution } from '@/types/incident-detection/overview-api'
import { joinRoadCodes, mergeSolutionRows } from '@/features/admin/traffic-volume/shared/utils/mergeSolutionRows'

// The backend leaves out a zero count, so either side can be missing.
const onlineOf = (camera: IncidentCentralSolution['camera']) => camera.online_count ?? camera.total - (camera.offline_count ?? 0)
const offlineOf = (camera: IncidentCentralSolution['camera']) => camera.offline_count ?? camera.total - (camera.online_count ?? 0)

/** Two rows of one install point — its cameras on two roads — as one: each
 *  counts its own cameras and today's events, so those add up; its
 *  notifications are counted per install point, the same on every row. */
const mergeIncidentRows = (into: IncidentCentralSolution, row: IncidentCentralSolution): IncidentCentralSolution => ({
  ...into,
  road: { ...into.road, code_name: joinRoadCodes(into.road.code_name, row.road.code_name) },
  camera: {
    total: into.camera.total + row.camera.total,
    online_count: onlineOf(into.camera) + onlineOf(row.camera),
    offline_count: offlineOf(into.camera) + offlineOf(row.camera),
    events_count: into.camera.events_count + row.camera.events_count,
  },
  geometry_point: into.geometry_point ?? row.geometry_point,
  noti_count: Math.max(into.noti_count, row.noti_count),
})

// The backend lists an install point once per road its cameras stand on, so
// one solution can come back as several rows — e.g. 964, whose cameras sit on
// นม.1016 and นม.3052 (see mergeSolutionRows). Table/grid rows key off
// solution.id alone, so each install point must be one row — one carrying ALL
// its cameras (dropping the later rows showed 964 with 2 of its 4). Shared by
// DataDisplaySection (table/grid/export) and InfoCardSection (active-by-warranty
// tally) so both agree.
export const mergeIncidentSolutions = (bureaus: APIResponseIncidentCentralList): APIResponseIncidentCentralList =>
  mergeSolutionRows(bureaus, mergeIncidentRows)

export type WarrantyStatus = 'in-warranty' | 'expired'

export interface IncidentRow {
  /** solution.id — used as the detail-page id. */
  id: string
  projectId: string
  roadId: string
  roadCode: string
  projectName: string
  contractNo: string
  /** ปีงบประมาณ (พ.ศ.) — shown in the เลขที่สัญญา column when contractNo is empty. */
  budgetYear?: number
  warranty: WarrantyStatus
  /** solution.solution_name (จุดติดตั้ง). */
  installPoint: string
  /** sub-department short name (แขวง) — table grouping key. */
  bureau: string
  totalCameras: number
  onlineCameras: number
  offlineCameras: number
  /** Incidents detected (camera.events_count). */
  events: number
}
// License is fetched on demand per solution via /analytic/license/{id} (the
// LicenseModal) — it is NOT carried on the row.
