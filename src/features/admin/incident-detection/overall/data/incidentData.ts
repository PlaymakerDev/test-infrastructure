// UI row shape for the Incident Detection overall tables (Tab1 summary + Tab2
// detail). Flattened from /analytic …/overview/central/list, tagged with its
// sub-department (แขวง) so the tables can group by bureau like traffic-signal.

import type { APIResponseIncidentCentralList } from '@/types/incident-detection/overview-api'

// The backend has been observed returning the same solution nested under two
// different department nodes in one central/list response (e.g. solution
// 964 under ขทช.นครราชสีมา — verified live). Table/grid rows key off
// solution.id alone (not department-scoped), so an unguarded duplicate
// crashes into a React "duplicate key" warning and silently doubles up
// export rows / inflates list-derived counts. Dedupe once, keeping the
// first occurrence — shared by DataDisplaySection (table/grid/export) and
// InfoCardSection (active-by-warranty tally) so both agree.
export const dedupeIncidentSolutions = (
  bureaus: APIResponseIncidentCentralList
): APIResponseIncidentCentralList => {
  const seen = new Set<number | string>()
  return bureaus.map((bureau) => ({
    ...bureau,
    sub_department: (bureau.sub_department ?? []).map((sub) => ({
      ...sub,
      solutions: (sub.solutions ?? []).filter((sol) => {
        if (seen.has(sol.solution.id)) return false
        seen.add(sol.solution.id)
        return true
      }),
    })),
  }))
}

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
