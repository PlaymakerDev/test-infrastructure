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

/** GET /lighting/diagrams/{imei} → circuit diagram data behind the diagram
 *  iframe. `components` (the drawable nodes — breakers, contactors, lamps,
 *  etc. with canvas positions) is sometimes empty even when `connections`
 *  (the wires between component ids) is populated — a backend data gap, not
 *  a fetch error. The iframe viewer then silently renders a blank canvas. */
export interface LightingDiagram {
  imei: string
  components: unknown[]
  connections: unknown[]
}

/** GET /lighting/departments/{id}/overview/top-power-roads?start_date=&end_date=
 *  → roads ranked by total power draw (kW) descending, for the given date
 *  range (both params required by the backend). */
export interface TopPowerRoadItem {
  road: {
    id: number
    code_name: string
    road_name: string
  }
  install_points: number
  total_kw: number
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

/** GET /lighting/logs4g/central?imei=&start_date=&end_date=&data_type=&page=&limit=
 *  → paginated IoT log records read from daily Mongo collections, sorted by
 *  created_at DESC. Replaces the old /lighting/logs4g (which silently ignored
 *  its `date` param and always returned "today"). */
export type Logs4gCentralDataType = 'volt_amp' | 'FMTS' | 'circuit' | 'UPS1' | 'UPS2' | 'UPS3' | 'line_check'

/** `circuit` status shape — first 5 fields map to ST/MB/PS/MC1/MC2; CB1-4 are
 *  always null; TFM is always 1 (per spec). */
export interface Logs4gCircuitStatus {
  ST: number
  MB: number
  PS: number
  MC1: number
  MC2: number
  CB1: number | null
  CB2: number | null
  CB3: number | null
  CB4: number | null
  TFM: number
}

/** `status` shape depends on `data_type`:
 *  - volt_amp/FMTS → string "{V} V - {A} A"
 *  - circuit        → Logs4gCircuitStatus
 *  - UPS1/UPS2/UPS3 → string "{f} {g} {h}"
 *  - line_check     → array of 8 (int | null), one per line_detect1..8 */
export type Logs4gCentralStatus = string | Logs4gCircuitStatus | Array<number | null>

export interface Logs4gCentralItem {
  /** Asia/Bangkok, formatted "YYYY-MM-DD HH:mm:ss" */
  created_at: string
  data_type: Logs4gCentralDataType
  /** null when the source value is 0 */
  phase: number | null
  status: Logs4gCentralStatus
}

export interface PaginatedLogs4gCentral {
  res_data: Logs4gCentralItem[]
  meta_data: PaginationMeta
}

