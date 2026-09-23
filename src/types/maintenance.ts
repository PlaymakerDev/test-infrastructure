// Maintenance API Types - from OpenAPI spec

// --- Request Types ---
/** POST /manage/maintenance/case — multi-device since the 2026-09-16 backend
 *  release. At least one target is required: camera_ids, solution_id or
 *  project_id. `camera_id` is the deprecated single-camera field (the backend
 *  merges it into camera_ids); new code sends `camera_ids`. */
export interface CreateCaseRequest {
  /** @deprecated backend merges this into `camera_ids` */
  camera_id?: string
  camera_ids?: string[]
  solution_id?: number | null
  project_id?: number | null
  // ── หนังสือแจ้งซ่อม (live since the 2026-09-18 backend release; the letter
  // PDF is generated from exactly these). ──
  /** เลขที่หนังสือแจ้งซ่อม */
  document_no?: string
  /** ลงวันที่แจ้งซ่อม — YYYY-MM-DD */
  document_date?: string | null
  /** วงเงินของโครงการ (THB) */
  project_budget?: number | null
  /** มอบหมายให้ / ตำแหน่ง / ช่องทางการติดต่อ */
  assignee_name?: string
  assignee_position?: string
  assignee_contact?: string
  /** ตามสัญญาจ้างข้อที่ */
  contract_clause?: string
  /** รูปภาพสถานะการทำงานอุปกรณ์. OMIT IT to let the backend build the sheet
   *  itself — it grabs a frame off every attached camera's HLS stream and tiles
   *  them into one labelled image (async; poll device_status_image_job). */
  device_status_image?: string[]
  /** ⚠ tbl_contractors PK — NOT the project's `contractor_id` (that one is a
   *  user id and the FK rejects it with "violates key constraint"). */
  contractor_id?: string
  category?: string
  /** เหตุผลการแจ้งซ่อม ของเจ้าหน้าที่ — the letter's reason. There is no
   *  `problem_found` on create: ปัญหาที่พบ is the contractor's to write. */
  problem?: string
  responsible?: string
  before_image?: string[]
  /** YYYY-MM-DD (or with time). Defaults to created_at + 7 days. */
  due_date?: string | null
}

export type CaseStatus = 'open' | 'in_progress' | 'pending_approval' | 'closed'

/** ⚠ This PUT overwrites every plain-string field it does NOT receive with ""
 *  — verified live 2026-09-21: sending only `problem_found` blanked both
 *  `problem` and `responsible`. So always echo back the current value of the
 *  string fields you are not editing (`category`, `problem`, `problem_found`,
 *  `responsible`, `solution_method`). Nullable fields are safe to omit:
 *  `due_date`, `inspection_date`, `is_closed` and `camera_ids` are left alone.
 */
export interface UpdateCaseRequest {
  category?: string
  /** เหตุผลการแจ้งซ่อม — the OFFICER's, written once on the letter. A
   *  contractor save must pass the server's value straight through. */
  problem?: string
  /** ปัญหาที่พบ — the CONTRACTOR's. Split out of `problem` by the backend on
   *  2026-09-21; the two used to share one column and overwrite each other. */
  problem_found?: string
  responsible?: string
  before_image?: string[]
  after_image?: string[]
  inspection_date?: string | null
  solution_method?: string
  is_closed?: boolean
  /** Replaces the whole camera set; omit to leave it alone, [] detaches all. */
  camera_ids?: string[] | null
  due_date?: string | null
  status?: CaseStatus
}

export interface MaintenanceCaseParams {
  status?: 'closed' | 'open' | 'inspected'
  date_from?: string
  date_to?: string
}

export interface MaintenanceHistoryParams {
  status?: 'all' | 'open' | 'in_progress' | 'closed'
  region_id?: number
  department_id?: number
  road_code?: string
  warranty?: 'in' | 'out'
  category?: string
  search?: string
  date_from?: string
  date_to?: string
}

// --- Response Types ---

// Hierarchical detail response (GET /maintenance/detail/{solution_type_id})
export interface SolutionLocationSolution {
  solution_id: number
  solution_name: string
  online_count: number
  offline_count: number
}

export interface SolutionLocation {
  solution_location_id: number
  solution_location_name: string
  online_count: number
  offline_count: number
  solution: SolutionLocationSolution[]
}

export interface DetailProject {
  project_id: number
  project_name: string
  online_count: number
  offline_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  device_count: number
  solution_location: SolutionLocation[]
}

export interface DetailRoad {
  road_id: number
  road_name: string
  road_code: string
  online_count: number
  offline_count: number
  projects_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  device_count: number
  projects: DetailProject[]
}

export interface DetailDepartment {
  department_id: number
  department_name: string
  online_count: number
  offline_count: number
  projects_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  device_count: number
  roads: DetailRoad[]
}

export interface DetailBureau {
  bureau_id: number
  bureau_name: string
  online_count: number
  offline_count: number
  projects_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  device_count: number
  departments: DetailDepartment[]
}

// Flat response types
export interface SummaryItem {
  solution_type_id: number
  type: string
  device_count: number
  location_count: number
}

/** GET /{prefix}/departments/{id}/{cameras|overview}/uptime-statistics?scope=all
 *  — per-domain online percentage used by Solution Overview's rings. The
 *  response also carries a domain-specific `{ total, online, offline }` block
 *  under a key named after the domain (e.g. `camera`, `traffic`, `lighting`),
 *  omitted here since only the aggregate percentage is needed. */
export interface UptimeStatistics {
  percentage: number
  is_maintain: boolean
}

export interface WarrantySummaryItem {
  in_warranty: boolean
  project_count: number
  device_count: number
  location_count: number
  online_count: number
  offline_count: number
  open_case_count: number
  in_progress_count: number
  closed_case_count: number
}

export interface OfflineRoadItem {
  road_id: number
  road_name: string
  location_count: number
  device_count: number
  offline_count: number
}

/** Which solutions a camera serves — drives the ประเภท badges. `id` matches
 *  SOLUTION_TYPE (1 CCTV, 2 Counting, 3 Analytic, …); `name` is the backend's
 *  own wording, which differs from the UI labels (Analytic → "Incident",
 *  Counting → "Volume"), so the id is what we map on. */
export interface CameraSolutionGroup {
  id: number
  name: string
}

export interface CameraItem {
  camera_id: string
  camera_name: string
  camera_ip: string
  status: boolean
  case_no?: string | null
  curl_updated_at?: string | null
  /** Live since 2026-09-16 — replaced the never-populated `category` string. */
  solution_group?: CameraSolutionGroup[] | null
  /** ⚠ Not sent by the backend today (kept so the columns light up the moment
   *  it does — ยี่ห้อ/รุ่น/Hostname currently render '-'/camera_name). */
  category?: string | null
  brand?: string | null
  model?: string | null
  hostname?: string | null
  anydesk?: string | null
  zerotier?: string | null
  username?: string | null
  password?: string | null
}

export interface SolutionDetailResponse {
  solution_id: number
  solution_name: string
  warranty_status: boolean
  online_count: number
  offline_count: number
  lists: CameraItem[]
}

/** One device on a case — `GET /manage/maintenance/case/{no}` replaced the old
 *  single `camera_id` field with this list (2026-09-16 backend release). */
export interface CaseCamera {
  camera_id: string
  camera_name: string
  camera_ip: string
  /** true = online */
  status: boolean
  curl_updated_at: string | null
}

/** Background build of the device-status contact sheet: one frame per attached
 *  camera's HLS stream, labelled and tiled into a single image. Unreachable
 *  cameras become "ไม่มีสัญญาณ" tiles, so `camera_captured < camera_total` is a
 *  normal outcome, not a failure. */
export interface DeviceStatusImageJob {
  status?: string
  attempts?: number
  camera_total?: number
  camera_captured?: number
  image_path?: string | null
  error?: string | null
  created_at?: string
  finished_at?: string | null
}

export interface CaseDetail {
  id: string
  case_no: string
  status: CaseStatus
  solution_id: number | null
  project_id: number | null
  contractor_id: string | null
  category: string
  responsible: string
  /** เหตุผลการแจ้งซ่อม ของเจ้าหน้าที่ (goes on the letter PDF). */
  problem: string
  /** ปัญหาที่พบ ของผู้รับจ้าง. Separate column only since 2026-09-21 and the
   *  backend did not backfill it, so read it via `contractorProblem()` —
   *  older cases still keep the contractor's text in `problem`. */
  problem_found?: string
  solution_method: string
  inspection_date: string | null
  /** Arrays since 2026-09-18; older payloads shipped a JSON-encoded string —
   *  always read them through `parseImageUrls`. */
  before_image: string[] | string | null
  after_image: string[] | string | null
  /** รูปภาพสถานะการทำงานอุปกรณ์ — uploaded by the officer, or built by the
   *  backend when the letter form left the box empty. */
  device_status_image?: string[] | string | null
  device_status_image_job?: DeviceStatusImageJob | null
  // ── หนังสือแจ้งซ่อม, as saved when the case was opened ──
  document_no?: string
  document_date?: string | null
  project_budget?: number | null
  assignee_name?: string
  assignee_position?: string
  assignee_contact?: string
  contract_clause?: string
  due_date: string | null
  notified_at: string | null
  approved_by: string | null
  approved_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  created_by: string
  camera_count: number
  cameras: CaseCamera[]
}

export interface CaseHistoryItem {
  case_no: string
  /** Legacy single-device fields — the endpoint dropped them when cases went
   *  multi-device (2026-09-16); the device list lives on GET case/{no}. */
  camera_name?: string
  camera_ip?: string
  problem: string
  responsible: string
  /** How many cameras this case covers. */
  camera_count?: number
  status?: CaseStatus
  /** Deadline — "วันที่ครบกำหนด". */
  due_date?: string | null
  reported_at?: string | null
  inspection_date?: string | null
  closed_at?: string | null
}

export interface HistoryCase {
  case_no: string
  /** ⚠ Dropped by the 2026-09-16 backend release — kept optional because rows
   *  that still carry it let the all-repairs table link to the detail page. */
  solution_id?: number | null
  category: string
  department_name: string
  /** ⚠ Also dropped in that release (a case can now cover several devices);
   *  use `camera_count` instead. */
  device_name?: string
  /** How many devices this case covers. */
  camera_count?: number
  location_name: string
  road_name: string
  status: CaseStatus
  reported_at: string
  /** Deadline — "วันที่ครบกำหนด". */
  due_date?: string | null
  /** Last health CHECK (it moves even while a device stays offline), so it
   *  can't date the outage on its own — prefer `offline_days`, which the
   *  backend started computing for real in the 2026-09-16 release. */
  curl_updated_at?: string | null
  offline_days: number
  solution_type: string
  warranty_status: boolean
}

export interface HistoryRegion {
  region_id?: number | null
  region_name: string
  cases: HistoryCase[]
}

export interface RegionItem {
  id: number
  name_th: string
  name_en: string
}

// One row of the "สรุปผู้รับจ้าง" page — matches
// GET /manage/maintenance/contractor-summary from the backend.
// email/phone are '' (never null) so the FE can always render them.
export interface ContractorSummaryRow {
  user_id: string
  short_name: string
  company_name: string
  email: string
  phone: string
  projects: number
  roads: number

  cctv_total: number
  cctv_offline: number
  traffic_total: number
  traffic_offline: number
  vms_total: number
  vms_offline: number
  lighting_total: number
  lighting_offline: number
  bridge_lighting_total: number
  bridge_lighting_offline: number
  wim_total: number
  wim_offline: number

  total_offline: number
  open_cases: number
}

// ── GET /manage/maintenance/central/{solution_type_id} ───────────────────────
// สทช. → ขทช. tree with device- AND location-level online/offline counts.
// Added by BE 2026-08-26 for the จุดติดตั้งอุปกรณ์ tab's sidebar (per-type:
// 1=CCTV, 6=Lighting, 7=VMS). `bureau_id` is a DB id, NOT the สทช. running
// number (e.g. สทช.2 has bureau_id 7) — treat as opaque; the response is
// already ordered for display and `bureau_name` carries the full label.

export interface MaintenanceCentralDepartment {
  department_id: number
  department_name: string
  online_count: number
  offline_count: number
  device_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
}

export interface MaintenanceCentralBureau {
  bureau_id: number
  bureau_name: string
  online_count: number
  offline_count: number
  device_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  departments: MaintenanceCentralDepartment[]
}

// ── GET /manage/maintenance/device-road/{department_id}?solution_type_id= ────
// Every device of one solution type on the department's roads, grouped by
// road (BE 2026-08-27) — the จุดติดตั้งอุปกรณ์ tab's table source. Only
// 1=CCTV, 6=Lighting, 7=VMS are supported.

export interface MaintenanceRoadDevice {
  name: string
  /** Km marker, e.g. "21+871" (bare — no "กม." prefix). May be null. */
  sta: string | null
  latitude: number
  longitude: number
  /** Thai device-category label (BE added 2026-08-31). Lighting sends
   *  'โคมไฟ' | 'ตู้โจรกรรม'; CCTV/VMS send an empty string (verified live
   *  across 25 departments — 7,798 CCTV + 151 VMS devices all ''). */
  device_type?: string | null
}

export interface MaintenanceDeviceRoad {
  road_id: number
  road_code: string
  road_name: string
  /** จุดติดตั้ง count on this road. */
  solution_count: number
  /** Device (camera/sign/cabinet) count on this road. */
  device_count: number
  device: MaintenanceRoadDevice[]
}
