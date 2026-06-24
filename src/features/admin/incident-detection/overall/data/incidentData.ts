// UI row shape for the Incident Detection overall tables (Tab1 summary + Tab2
// detail). Flattened from /analytic …/overview/central/list, tagged with its
// sub-department (แขวง) so the tables can group by bureau like traffic-signal.

export type WarrantyStatus = 'in-warranty' | 'expired'

export interface IncidentRow {
  /** solution.id — used as the detail-page id. */
  id: string
  projectId: string
  roadId: string
  roadCode: string
  projectName: string
  contractNo: string
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
