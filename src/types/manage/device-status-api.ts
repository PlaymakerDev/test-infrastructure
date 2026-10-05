// /manage/project/device-status — device online/offline counts per project,
// and one project's CCTV cameras grouped by road + chainage (BE 2026-10-01).
// Backs the settings ผู้รับจ้าง → สรุปข้อมูลผู้รับจ้าง page.

export interface DeviceTotals {
  total: number
  online: number
  offline: number
}

interface ProjectDeviceStatusBase {
  project_id: number
  project_name: string
  contract_no: string | null
  budget_year: number
  department: { id: number; department_short_name: string | null }
  contractor: { id: string; company_name: string | null; short_name: string | null }
  warranty_start_date: string | null
  warranty_end_date: string | null
  /** warranty_start_date <= now <= warranty_end_date */
  is_warranty: boolean
  /** `road` = visible only through roads the caller's department maintains,
   *  so the roads and counts cover just those. */
  access_scope: 'project' | 'road'
  roads: { road_id: number; road_code: string; department_id: number }[]
}

/** GET /manage/project/device-status — one row per project. `cameras` counts
 *  every camera serving a solution on the project's roads (any module). */
export interface ProjectDeviceStatusRow extends ProjectDeviceStatusBase {
  cameras: DeviceTotals
  vms: DeviceTotals
  lighting: DeviceTotals
}

export interface APIRequestProjectDeviceStatusList {
  /** The contractor's user_id (tbl_users.id) — not tbl_contractors.id, which
   *  matches nothing. */
  contractor_id?: string
  is_warranty?: boolean
  budget_year?: number
  /** project_name / contract_no */
  search?: string
  page?: number
  /** At most 100 — a larger value is refused (400). */
  limit?: number
}

export interface APIResponseProjectDeviceStatusList {
  res_data: ProjectDeviceStatusRow[]
  meta_data: { count: number; page: number; limit: number; total_pages: number }
}

export interface ProjectCameraItem {
  id: string
  camera_name: string
  ip_address: string
  is_online: boolean
  last_updated: string | null
  /** Every module the camera serves (1 CCTV, 2 Counting, 3 Analytic, …). */
  solution_types: { id: number; name: string }[]
}

export interface ProjectCameraGroup extends DeviceTotals {
  road_id: number
  road_code: string
  /** Chainage such as "2+800"; "" or null when the cameras carry none. */
  sta: string | null
  cameras: ProjectCameraItem[]
}

/** GET /manage/project/device-status/{id} — ordered by road_code, then chainage. */
export interface APIResponseProjectDeviceStatus extends ProjectDeviceStatusBase, DeviceTotals {
  groups: ProjectCameraGroup[]
}
