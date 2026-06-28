// Types for the Lighting service (base path /lighting).
// Based on the OpenAPI spec + the actual backend response fields observed
// (the spec omits GeometryPoint / imei — they are sent at runtime).

export interface LightingEquipment {
  count: number | null
  type: string | null
}

export interface LightingInfo {
  equipment: LightingEquipment
  has_broken_wire: boolean
  is_online: boolean
}

export interface LightingSolution {
  id: number
  solution_name: string
}

export interface LightingRoad {
  id: number
  code_name: string
}

export interface LightingProject {
  budget_year: number
  contract_no: string
  id: number
  project_name: string
}

/** One lighting solution/road-segment. `GeometryPoint` + `imei` are runtime-only. */
export interface LightingOverviewListItem {
  is_warranty: boolean
  lighting: LightingInfo
  project: LightingProject
  proxy_url: string
  road: LightingRoad
  solution: LightingSolution
  /** [lng, lat] — present in the real response, omitted by the spec */
  GeometryPoint?: [number, number]
  /** device IMEI — present once central/list returns it */
  imei?: string
}

/** GET /lighting/departments/{id}/overview → map geometry */
export interface LightingOverviewResponse {
  /** [lng, lat] map center */
  centroid: [number, number] | null
  locations: LightingOverviewListItem[]
}

/** GET /lighting/departments/{id}/overview/central/totals → solution & warranty totals */
export interface LightingOverviewTotals {
  solution: { total: number; online: number; offline: number }
  warranty: { active: number; expired: number }
}

export interface OverviewCentralDept {
  department_id: number
  department_short_name: string
  solutions: LightingOverviewListItem[]
}

/** GET /lighting/departments/{id}/overview/central/list → bureau → sub-dept → solutions */
export interface OverviewCentralItem {
  department_id: number
  department_short_name: string
  sub_department: OverviewCentralDept[]
}

// --- random-online (device detail for the left card) ---

export interface DetailsElectricityItem {
  phase: string
  timestamp: string
  voltage: number
  amplitude: number
  watt: number
  power_factor: number
  frequency: number
}

export interface DetailsLineChecks {
  line_check1: number
  line_check2: number
  line_check3: number
  line_check4: number
  line_check5: number
  line_check6: number
  line_check7: number
  line_check8: number
}

/** GET /lighting/departments/{id}/overview/random-online → one online device */
export interface DetailsResponse {
  imei: string
  is_online: boolean
  /** 1 = single-phase, 3 = three-phase */
  phase: number
  has_broken_wire: boolean
  line_checks: DetailsLineChecks
  electricity: DetailsElectricityItem[]
}

/** GET /lighting/logs4g/graph/volt → [{ Period_Name, volt }]
 *  GET /lighting/logs4g/graph/amp  → [{ Period_Name, amp }]
 *  Period_Name is an hourly label "00:00".."23:00"; volt/amp null when no data. */
export interface Logs4gVoltPoint { Period_Name: string; volt: number | null }
export interface Logs4gAmpPoint { Period_Name: string; amp: number | null }

/** GET /lighting/imei/{imei}/alerts → { res_data: AlertItem[], meta_data: PaginationMeta } */
export interface AlertItem {
  imei: number
  timestamp: string
  /** event name, e.g. "Warning-Transformer เฟส 1" */
  equipment_id: string
  /** event description, e.g. "กลับมาใช้งานได้" */
  incident: string
  /** "UP" | "DOWN" */
  status: string
}

export interface PaginationMeta {
  count: number
  page: number
  limit: number
  total_pages: number
}

/** GET /lighting/imei/{imei}/electricity?report_type= → aggregated rows.
 *  Each row = one period bucket (label) with per-phase averages. */
export interface ElectricityPhaseData {
  phase: string
  voltage: number
  amplitude: number
  watt: number
  power_factor: number
  frequency: number
}
export interface ElectricityAggItem {
  label: string
  phases: ElectricityPhaseData[]
}
export interface PaginatedElectricityAgg {
  res_data: ElectricityAggItem[]
  meta_data: PaginationMeta
}

export interface PaginatedAlerts {
  res_data: AlertItem[]
  meta_data: PaginationMeta
}

/** GET /lighting/logs4g?imei= → raw IoT log records for today.
 *  Each record has a `data_type` (UPS1, UPS2, circuit, volt_amp, FMTS,
 *  line-check); the meaning of fields a..o depends on the type, so we keep
 *  them as a string bag and interpret per-type in the UI. */
export interface Logs4gRecord {
  data_type: string
  date_time: string
  phase: number
  e: string
  f: string
  g: string
  h: string
  i: string
  j: string
  k: string
  l: string
  m: string
  n: string
  o: string
  line_detect1: string | null
  line_detect2: string | null
  line_detect3: string | null
  line_detect4: string | null
  line_detect5: string | null
  line_detect6: string | null
  line_detect7: string | null
  line_detect8: string | null
  [key: string]: string | number | null
}

