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

/** A system that runs controllers of its own with cameras attached (Traffic
 *  Signal, Crosswalk, VMS): `system` counts the controllers on the system's
 *  own online rule, `camera` the distinct cameras linked to them. */
export interface SystemCameraTotals {
  system: DeviceTotals
  camera: DeviceTotals
}

/** GET /manage/project/device-status/summary (BE 2026-10-27) — the projects of
 *  /device-status, in its order and under its filters, with every system
 *  counted. It also lists a project whose devices are all outside CCTV / VMS /
 *  Street Light (traffic controllers and no camera), which the list leaves out. */
export interface ProjectDeviceSummaryRow extends ProjectDeviceStatusBase {
  /** Cameras under a CCTV solution that no other counted system uses. */
  cctv: DeviceTotals
  /** Cameras linked to the project's Counting / Analytic / LPR solutions. */
  counting: DeviceTotals
  analytic: DeviceTotals
  lpr: DeviceTotals
  traffic: SystemCameraTotals
  crosswalk: SystemCameraTotals
  lighting: DeviceTotals
  vms: SystemCameraTotals
  bridge_lighting: DeviceTotals
  /** The tunnel's sensors (legacy devices). */
  tunnel: DeviceTotals
}

export interface APIResponseProjectDeviceSummaryList {
  res_data: ProjectDeviceSummaryRow[]
  meta_data: { count: number; page: number; limit: number; total_pages: number }
}

/** A camera as /device-status/solutions lists it, ordered by chainage. */
export interface SolutionCamera {
  id: string
  camera_name: string
  /** "5+800"; "" when it has none. */
  sta: string
  ip_address: string
  /** curl_status */
  is_online: boolean
  /** Every solution type the camera serves, anywhere — its own solution and
   *  each module that links it — as upper-cased tbl_solution_type names in
   *  type order: ["CCTV", "COUNTING"], ["CCTV", "WIM"] … (BE 2026-10-27). */
  solution_group: string[]
}

/** A Counting / Analytic / LPR / CCTV solution — an install point — and its cameras. */
export interface CameraSolution {
  solution_id: number
  solution_name: string
  cameras: SolutionCamera[]
}

/** A traffic / crosswalk / VMS controller (`id` = its module row) with its
 *  own online state and linked cameras. */
export interface SystemSolution extends CameraSolution {
  id: number
  is_online: boolean
}

/** A bridge-lighting installation (`id` = its module row). */
export interface StatusSolution {
  id: number
  solution_id: number
  solution_name: string
  is_online: boolean
}

/** A lamp (โคม) of a street-light cabinet, named by its pole number ("โคมที่ 1"). */
export interface LightingLamp {
  id: number
  name: string
  pole_number: number | null
  /** "" when it has none. */
  sta: string
  /** The legacy status "1". */
  is_online: boolean
  last_connectd: string | null
}

/** A street-light cabinet (`id` = its tbl_lighting row) with its lamps. */
export interface LightingSolution extends StatusSolution {
  /** The cabinet's chainage (its solution's); "" when it has none. */
  sta: string
  /** The lighting overview's has_broken_wire: some node of one of the
   *  cabinet's IoT boxes reads its wire broken at both ends. */
  has_broken_wire: boolean
  lamps: LightingLamp[]
}

export interface TunnelDevice {
  id: string
  device_name: string
  /** lastupdate within the last hour */
  is_online: boolean
  last_update: string | null
}

export interface TunnelSolution {
  solution_id: number
  solution_name: string
  /** Empty when the tunnel has no wid or no legacy device. */
  devices: TunnelDevice[]
}

/** GET /manage/project/device-status/summary's projects with the rows behind
 *  each count (BE 2026-10-27, /device-status/solutions) — the same rules,
 *  except `cctv`: every CCTV solution of the project with all of its cameras,
 *  so a camera another system uses is listed under both. A camera of the
 *  project's systems registered under another project's CCTV solution is in
 *  that system's list only. */
export interface ProjectDeviceSolutionsRow extends ProjectDeviceStatusBase {
  cctv: CameraSolution[]
  counting: CameraSolution[]
  analytic: CameraSolution[]
  lpr: CameraSolution[]
  traffic: SystemSolution[]
  crosswalk: SystemSolution[]
  vms: SystemSolution[]
  lighting: LightingSolution[]
  bridge_lighting: StatusSolution[]
  tunnel: TunnelSolution[]
}

export interface APIResponseProjectDeviceSolutionsList {
  res_data: ProjectDeviceSolutionsRow[]
  meta_data: { count: number; page: number; limit: number; total_pages: number }
}

export interface ProjectCameraItem {
  id: string
  camera_name: string
  ip_address: string
  /** The camera's own stream, the same as GET /cctv/cameras/{id} (BE added
   *  it 2026-10-08 — before that the modal had to look it up elsewhere). */
  hls_url: string
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

/** Query of the per-project device lists — /cameras, /lighting and /vms. */
export interface APIRequestProjectDeviceStatusItems {
  /** The contractor's user_id, as for the list. */
  contractor_id?: string
  /** true = online devices only, false = offline only, omitted = all. */
  is_online?: boolean
}

/** A camera of the flat per-project list: the same item plus its road. */
export interface ProjectCameraListCamera extends ProjectCameraItem {
  road_id: number
  road_code: string
  sta: string
}

/** GET /manage/project/device-status/cameras — every visible project with its
 *  cameras in one call (not paginated), ordered by road_code then chainage. A
 *  project with no matching camera still comes back, with `cameras: []`. */
export interface ProjectCameraListItem {
  project_id: number
  project_name: string
  contract_no: string | null
  cameras: ProjectCameraListCamera[]
}

/** One street-light cabinet (lighting.tbl_lighting), IoT or LoRa. */
export interface ProjectLightingItem {
  id: number
  solution_id: number
  /** The cabinet's install point, chainage included ("รย.4036 ตู้ที่ 10 กม.12+300"). */
  solution_name: string
  /** null for a LoRa cabinet. */
  imei: string | null
  is_online: boolean
  last_updated: string | null
  road_id: number
  road_code: string
  /** Empty for every cabinet so far — the backend is filling it in (2026-10-09). */
  sta: string
}

/** GET /manage/project/device-status/lighting — same projects as /cameras. */
export interface ProjectLightingListItem {
  project_id: number
  project_name: string
  contract_no: string | null
  lighting: ProjectLightingItem[]
}

/** One VMS sign (vms.tbl_vms). */
export interface ProjectVMSItem {
  id: number
  solution_id: number
  /** The sign's install point ("TrafficSign : นฐ.3011 - จุดที่ 1"). */
  solution_name: string
  ip_address: string
  is_online: boolean
  last_updated: string | null
  desktop_screen: string
  road_id: number
  road_code: string
  /** "" when the sign has none. */
  sta: string
}

/** GET /manage/project/device-status/vms — same projects as /cameras. */
export interface ProjectVMSListItem {
  project_id: number
  project_name: string
  contract_no: string | null
  vms: ProjectVMSItem[]
}
