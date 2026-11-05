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

/** Optional narrowing filter for the overview/central/list/central/totals/
 *  random-online endpoints — forwarded from the sidebar's road solution menu
 *  (`?road_id=`), same as CCTV/incident-detection/traffic-volume. */
export interface APIRequestLightingCentralList {
  road_id?: number
  /** Narrow to ONE solution (`ts.id`). Backed by the same
   *  `LightingOverviewQueryParams` struct as `road_id`, so it works on every
   *  endpoint in this family; `/overview` + this is how a caller holding only a
   *  solution id gets that device's `imei` and `lighting.equipment.type`
   *  without pulling and scanning a department-wide list. */
  solution_id?: number
  /** Include this department's descendant units. Required when resolving a
   *  device from the nationwide Alert statistic tree. */
  scope?: 'all'
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

/** GET /lighting/logs4g/graph/volt?imei=&phase_type= → [{ Period_Name, volt, volt2, volt3 }]
 *  GET /lighting/logs4g/graph/amp?imei=&phase_type=  → [{ Period_Name, amp, amp2, amp3 }]
 *  Period_Name is an hourly label "00:00".."23:00". `phase_type` does NOT filter
 *  the response — the endpoint always returns all 3 phase columns; `volt`/`amp`
 *  is phase 1, `volt2`/`amp2` is phase 2, `volt3`/`amp3` is phase 3. Any/all
 *  null when no data for that hour. Single-phase devices only ever populate
 *  `volt`/`amp` (phase 1) — `volt2`/`volt3`/`amp2`/`amp3` stay null. */
export interface Logs4gVoltPoint { Period_Name: string; volt: number | null; volt2: number | null; volt3: number | null }
export interface Logs4gAmpPoint { Period_Name: string; amp: number | null; amp2: number | null; amp3: number | null }

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

/** Alerts' `meta_data` additionally carries the global UP/DOWN split so the
 *  summary badges don't need to be derived from just the loaded page. */
export interface AlertsPaginationMeta extends PaginationMeta {
  count_up: number
  count_down: number
}

export interface PaginatedAlerts {
  res_data: AlertItem[]
  meta_data: AlertsPaginationMeta
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

// ── GET /lighting/solutions/{solution_id} — one install point ────────────────
// BE answers the payload bare (no res_data). A lamp point is a LoRa gateway
// with no IMEI: `iot` is null and its lamps come in `devices`; a cabinet is
// the other way round.

/** One lamp (a tbl_lighting_device row). */
export interface LightingSolutionDevice {
  id: number
  /** The lamp node's own id — a LoRa DevEUI such as "24E124746F069297", or
   *  "xxx01" on a wired run — not an IMEI. */
  device_id: string
  pole_number: number | null
  /** "SEM" / "SEM-Wired" */
  device_type: string
  /** "CT Sensor" on every lamp so far. */
  device_desc: string
  /** When the lamp last reported — "dd/mm/yyyy HH:mm:ss", Buddhist year;
   *  `''` when never. */
  last_connectd: string
  /** Empty on every lamp so far. */
  last_update: string
}

/** The LoRa gateway's own tally of its lamps. Counts are the last the gateway
 *  sent — they stay put while it is silent. */
export interface LightingSolutionLora {
  online_count: number
  offline_count: number
  /** The gateway reported in the last 30 minutes. */
  is_online: boolean
}

export interface LightingSolutionIot {
  id: number
  imei: string
  phase_type: string
  sem_type: string
  diagram_type: string
  connection_type: string
  send_frequency: string
  last_update: string
  is_online: boolean
  has_broken_wire: boolean
}

export interface LightingSolutionDetail {
  project: {
    id: number
    project_name: string
    contract_no: string | null
    project_no: string | null
    budget_year: number
    warranty_start_date: string | null
    warranty_end_date: string | null
    is_warranty: boolean
    department_id: number
  }
  road: { id: number; road_code: string; road_name: string }
  solution: {
    id: number
    solution_name: string
    sta: string | null
    ip_address: string | null
    remarks: string
  }
  lighting: {
    id: number
    lighting_type: number
    proxy_url: string
    iot: LightingSolutionIot | null
    lora: LightingSolutionLora | null
    /** null when the point has no lamp rows. */
    devices: LightingSolutionDevice[] | null
  }
}

// ── GET /lighting/solutions/{solution_id}/lamps[/summary|/weekly] ────────────
// A LoRa lamp point's lamps as the legacy SEM page reads them (getMarkerSEM,
// getStatusSEM, getChartWeekSEM — BE 2026-11-05). Answered bare.

/** One lamp — a legacy tbl_device row. */
export interface LightingLamp {
  /** Legacy devid: the table's รหัสอุปกรณ์ (same value as the solution
   *  detail's `devices[].device_id`, trailing spaces included) and the id the
   *  logs endpoint takes. */
  device_id: string
  /** Empty on most points. */
  dev_eui: string
  /** "SEM" / "SEM-Wired" */
  device_type: string
  /** Pole number as text — "1". */
  pole: string
  /** Lamps on the pole: "1" or "2". */
  lamp_type: string
  /** The last non-zero current since the 07:00 reset (so 0 through the
   *  day); 0 when not online; null when blank. */
  current: number | null
  /** "ปกติ" or "ดับ" — ดับ also when the lamp is not online. */
  status: string
  /** "ใช้งานได้" / "ดับ 1 โคม" / "ดับ 2 โคม"; null when no rule matches. */
  state: string | null
  /** Reported within the last 13 hours (false = the legacy ติดต่อไม่ได้). */
  is_online: boolean
  battery: number | null
  rssi: number | null
  sta: string
  highmast_group: string
  lat: number | null
  lng: number | null
  /** "dd/mm/yyyy HH:mm:ss", Buddhist year; `''` when never reported. */
  last_update: string
}

export interface LightingLampList {
  solution_id: number
  wid: number
  total: number
  lamps: LightingLamp[] | null
}

/** The legacy work master's tally, recomputed every 2 hours — it can trail
 *  the lamps (ทล.107 counts 70 working while none has reported since 2565),
 *  so the page counts the lamps instead and reads only the position here. */
export interface LightingLampSummary {
  solution_id: number
  wid: number
  detail: string
  lat: number | null
  lng: number | null
  total: number
  work: number
  fail: number
}

/** One day of the 7-day tally (legacy tbl_sem_sum_daily). */
export interface LightingLampDay {
  /** "dd/mm/yy", Buddhist year — "30/10/69". */
  date: string
  total: number
  work: number
  fail: number
}

export interface LightingLampWeekly {
  solution_id: number
  wid: number
  /** Oldest first; empty when the point has no tally. */
  days: LightingLampDay[] | null
}

/** One hour of `/lamps/current/hourly` — lamps averaged per hour first, then
 *  together, so a lamp that reports often doesn't outweigh the rest. */
export interface LightingLampCurrentHour {
  /** "18:00" */
  hour: string
  /** null when no lamp reported in this hour; 0 = lamps reported no current. */
  avg_amp: number | null
  min_amp: number | null
  max_amp: number | null
  /** Lamps that reported in this hour. */
  lamps: number
  /** Readings in this hour. */
  samples: number
}

/** GET /lighting/solutions/{solution_id}/lamps[/{device_id}]/current/hourly
 *  — a Bangkok day (`?date=YYYY-MM-DD`, today when omitted), always 24 hours
 *  from 00:00. Readings exist only from the day BE began sampling. */
export interface LightingLampCurrentHourly {
  solution_id: number
  wid: number
  /** "2026-11-05" */
  date: string
  /** Set on the one-lamp endpoint. */
  device_id: string | null
  hours: LightingLampCurrentHour[] | null
}

