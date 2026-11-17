// /manage/project/device-status — device online/offline counts per project,
// and one project's CCTV cameras grouped by road + chainage (BE 2026-10-01).
// Backs the settings ผู้รับจ้าง → สรุปข้อมูลผู้รับจ้าง page.

export interface DeviceTotals {
  total: number
  online: number
  offline: number
}

/** The project fields every /device-status listing opens each row with. */
export interface ProjectDeviceStatusBase {
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
  tunnel: TunnelSummaryTotals
}

/** /summary's tunnel: its sensors (legacy devices), and since BE 2026-11-17
 *  the tunnels themselves (`system`). Checked that day: `system` counts only
 *  a tunnel with sensors, online when any reported within the hour — the
 *  Tunnel ring (uptime-statistics) counts every tunnel, online when a camera
 *  at the tunnel is, so the two differ until the backend picks one rule. */
export interface TunnelSummaryTotals extends DeviceTotals {
  system: DeviceTotals
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
  /** An open นอกเหนือการรับประกัน record on the camera — set wherever it is
   *  listed (BE 2026-11-16). */
  is_out_of_warranty?: boolean
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
  /** An open นอกเหนือการรับประกัน record on the controller's solution (BE
   *  2026-11-16). */
  is_out_of_warranty?: boolean
}

/** A bridge-lighting installation (`id` = its module row). */
export interface StatusSolution {
  id: number
  solution_id: number
  solution_name: string
  is_online: boolean
  /** An open นอกเหนือการรับประกัน record on the solution (BE 2026-11-16). */
  is_out_of_warranty?: boolean
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
  /** The cabinet's — street lighting is recorded per solution. */
  is_out_of_warranty?: boolean
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
  /** The tunnel's — a tunnel is recorded per solution, its devices with it
   *  (BE 2026-11-17). */
  is_out_of_warranty?: boolean
  last_update: string | null
}

export interface TunnelSolution {
  solution_id: number
  solution_name: string
  /** An open นอกเหนือการรับประกัน record on the tunnel's solution (BE 2026-11-17). */
  is_out_of_warranty?: boolean
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

// ── อุปกรณ์นอกเหนือการค้ำประกัน (BE 2026-11-16) ──────────────────────────────
// A device whose failure the warranty does not cover — a car hit it, a cable
// cut or stolen, another accident — recorded per project with what the
// inspection found and up to two photos. A record closes by itself once its
// device is back online; uptime-statistics then stops counting it.

/** What can be recorded: cameras one by one (camera_id), the other six per
 *  solution (solution_id) — Crosswalk and Tunnel since BE 2026-11-17. Traffic
 *  Volume, Incident Detection and LPR count through their cameras. */
export type OutOfWarrantyDeviceType = 'cctv' | 'vms' | 'lighting' | 'traffic' | 'crosswalk' | 'bridge_lighting' | 'tunnel'

/** A device as GET …/out-of-warranty/candidates lists it. */
export interface OutOfWarrantyCandidate {
  solution_id: number
  solution_name: string
  /** "5+800"; "" when it has none. */
  sta: string
  /** "" for a street-light cabinet. */
  ip_address: string
  /** Cameras: curl_status, online ones listed too. Systems: always false. */
  is_online: boolean
  /** When it was last heard from; null when online or never reached. */
  offline_since: string | null
  /** Already has an open record. */
  is_out_of_warranty: boolean
  record_id: number | null
}

export interface OutOfWarrantyCandidateCamera extends OutOfWarrantyCandidate {
  camera_id: string
  camera_name: string
}

/** GET /manage/project/device-status/out-of-warranty/candidates?project_id —
 *  every camera of the project and its offline systems, by chainage. Admin
 *  and contractor only (a role-user account gets 403). */
export interface APIResponseOutOfWarrantyCandidates extends ProjectDeviceStatusBase {
  cctv: OutOfWarrantyCandidateCamera[]
  vms: OutOfWarrantyCandidate[]
  lighting: OutOfWarrantyCandidate[]
  traffic: OutOfWarrantyCandidate[]
  /** Offline unless a camera answers and the crossing logged within the day. */
  crosswalk: OutOfWarrantyCandidate[]
  bridge_lighting: OutOfWarrantyCandidate[]
  /** Offline when none of its legacy devices reported within the hour; a
   *  tunnel without legacy devices is not listed. */
  tunnel: OutOfWarrantyCandidate[]
}

/** The record part every out-of-warranty read carries. */
export interface OutOfWarrantyRecordInfo {
  /** The record id. */
  id: number
  /** ผลการตรวจสอบ */
  inspection_result: string
  /** Up to two photo URLs (or upload-service paths); [] when none. */
  images: string[]
  /** When the device was last heard from, as it stood when recorded. */
  offline_since: string | null
  created_at: string
  created_by: string
  /** The contractor's company name, else the user's full name or username. */
  created_by_name: string
  updated_at: string | null
  updated_by: string | null
}

/** GET (and PUT) /manage/project/device-status/out-of-warranty/projects/{id} —
 *  one open record, cameras by chainage first. */
export interface OutOfWarrantyRecord extends OutOfWarrantyRecordInfo {
  project_id: number
  device_type: OutOfWarrantyDeviceType
  /** Set for a camera, null for a system. */
  camera_id: string | null
  /** Set for a system, null for a camera. */
  solution_id: number | null
  /** camera_name / solution_name */
  device_name: string
  ip_address: string
  sta: string
  is_online: boolean
}

/** One device of the PUT body — camera_id or solution_id, exactly one. The
 *  list sent becomes the project's open records: a device left out has its
 *  record closed. */
export interface OutOfWarrantyRecordRequest {
  project_id: number
  camera_id?: string
  solution_id?: number
  inspection_result: string
  images: string[]
}

export interface OutOfWarrantySystemItem extends OutOfWarrantyRecordInfo {
  solution_id: number
  solution_name: string
  sta: string
  ip_address: string
  is_online: boolean
}

export interface OutOfWarrantyCameraItem extends OutOfWarrantySystemItem {
  camera_id: string
  camera_name: string
}

/** GET /manage/project/device-status/out-of-warranty — the projects with open
 *  records only, each with just its recorded devices. */
export interface OutOfWarrantyProjectRow extends ProjectDeviceStatusBase {
  cctv: OutOfWarrantyCameraItem[]
  vms: OutOfWarrantySystemItem[]
  lighting: OutOfWarrantySystemItem[]
  traffic: OutOfWarrantySystemItem[]
  crosswalk: OutOfWarrantySystemItem[]
  bridge_lighting: OutOfWarrantySystemItem[]
  tunnel: OutOfWarrantySystemItem[]
}

export interface APIResponseOutOfWarrantyProjects {
  res_data: OutOfWarrantyProjectRow[] | null
  meta_data: { count: number; page: number; limit: number; total_pages: number }
}

/** The list's filters (as /device-status/solutions), plus one project or one
 *  kind of device. */
export interface APIRequestOutOfWarrantyProjects extends APIRequestProjectDeviceStatusList {
  project_id?: number
  device_type?: OutOfWarrantyDeviceType
}
