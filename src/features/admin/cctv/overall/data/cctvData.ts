// Shared CCTV view types. All list/map/table data now comes from the live
// `/cctv` API — this file keeps only the shapes the detail page builds from it.

import type { APIResponseCCTVOverviewCentralList } from '@/types/cctv/overview-api'

// The backend has been observed returning the same solution nested under two
// different department nodes in one central/list response (same class of
// bug documented for incident-detection's central/list — see
// incidentData.ts's dedupeIncidentSolutions). Table/grid rows key off
// solution.id alone (not department-scoped), so an unguarded duplicate
// crashes into a React "duplicate key" warning and silently doubles up
// export rows / inflates list-derived counts. Dedupe once, keeping the
// first occurrence — shared by OverallSection (table/grid/export) and
// StatsSectionCctv (active-by-warranty tally) so both agree.
export const dedupeCctvSolutions = (
  bureaus: APIResponseCCTVOverviewCentralList
): APIResponseCCTVOverviewCentralList => {
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

// ── Install-point detail (built from the central/list API in the detail screen) ──

export interface CctvInstallPin {
  id: string
  coord: [number, number]
  online: boolean
}

export interface PanelCamera {
  id: string
  name: string
  ip: string
  online: boolean
  /** Station / km marker, e.g. "7+900" (from camera `sta`). */
  km?: string
  hlsUrl?: string
  functions?: string[]
  /** [lng, lat] — used to plot the camera on the detail map. */
  coord?: [number, number]
  /**
   * Install-point (solution_location) id this camera belongs to. Optional —
   * only the route-search map sets it, to hover-highlight every pin sharing an
   * install point and dim the rest. Absent on the single-install detail map.
   */
  groupId?: string
  /** Install-point (จุดติดตั้ง) display name — shown on hover next to the pin. */
  groupName?: string
}

export interface CctvInstallDetail {
  id: string
  roadCode: string
  title: string
  location: string
  projectName: string
  contractNo: string
  warrantyStatus: WarrantyStatus
  /** project.id / road.id — feed the central Project Info modal (ⓘ in header). */
  projectId?: number
  roadId?: number
  googleMapUrl?: string
  coord: [number, number]
  totalCameras: number
  onlineCameras: number
  offlineCameras: number
  pins: CctvInstallPin[]
  cameras: PanelCamera[]
}
