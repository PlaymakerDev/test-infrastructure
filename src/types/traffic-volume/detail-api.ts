// Traffic Volume — Detail page API types
// Verified against the counting backend where noted.

// ── GET /counting/details/count_hour?solution_id={id}&date={YYYY-MM-DD} ──────
// Hourly counts + PCU breakdown by vehicle type for a single solution. Drives
// the hourly line chart on the detail page (ภาพรวม tab).

export interface APIRequestTrafficVolumeCountHour {
  solution_id: string | number
  /** YYYY-MM-DD. Omit to let the backend default to today. */
  date?: string
}

export interface CountingHourBucket {
  /** ISO 8601 hour bucket, e.g. "2026-06-22T00:00:00+07:00". */
  hour_timestamp: string
  bike_count: number
  car_count: number
  truck_count: number
  bus_count: number
  taxi_count: number
  pickup_count: number
  trailer_count: number
  total_count: number
  bike_pcu: number
  car_pcu: number
  truck_pcu: number
  bus_pcu: number
  taxi_pcu: number
  pickup_pcu: number
  trailer_pcu: number
  total_pcu: number
}

/** Daily aggregated count + PCU per vehicle type. `total` is the wholeday
 *  rollup (with `pcu_factor: null` because the average doesn't apply). */
export interface CountingVehicleTypeStat {
  count: number
  /** PCU multiplier — `null` only on the `total` aggregate. */
  pcu_factor: number | null
  total_pcu: number
  percentage: number
}

export interface CountingDailyVehicleCount {
  bike: CountingVehicleTypeStat
  car: CountingVehicleTypeStat
  truck: CountingVehicleTypeStat
  bus: CountingVehicleTypeStat
  taxi: CountingVehicleTypeStat
  pickup: CountingVehicleTypeStat
  trailer: CountingVehicleTypeStat
  total: CountingVehicleTypeStat
}

export interface APIResponseTrafficVolumeCountHour {
  daily_count_hour: CountingHourBucket[]
  daily_vehicle_count: CountingDailyVehicleCount
}

// ── GET /manage/solution/details/{id} ────────────────────────────────────────
// Solution-level admin metadata — same shared endpoint used by traffic-signal.
// We only consume `anydesk` for the title bar; everything else is informational.

export interface APIResponseTrafficVolumeSolutionDetail {
  id: number
  solution_name: string
  /** Empty string means "no AnyDesk configured" — render the button muted. */
  anydesk: number | string | null
  geometry_point: [number, number] | null
}

// ── GET /counting/details/summary_daily?solution_id={id}&date={YYYY-MM-DD} ───
// Aggregated daily numbers — drives the right-rail InfoCards on the detail
// page (ภาพรวม tab). `date` defaults to today on the backend when omitted.

export interface APIRequestTrafficVolumeSummaryDaily {
  solution_id: string | number
  /** YYYY-MM-DD. Omit to let the backend default to today. */
  date?: string
}

export interface APIResponseTrafficVolumeSummaryDaily {
  /** รวมยานพาหนะประจำวัน (คัน) */
  total_count: number
  /** PCU ประจำวัน */
  total_pcu: number
  /** ปริมาณจราจรเฉลี่ยรายชั่วโมง (คัน/ชั่วโมง) */
  avg_count_per_hour: number
  /** PCU เฉลี่ยรายชั่วโมง — currently unused by the UI. */
  avg_pcu_per_hour: number
  /** ความเร็วเฉลี่ยรายชั่วโมง (กม./ชม.) */
  avg_speed: number
  /** AADT (Annual Average Daily Traffic) ย้อนหลัง 7 วัน (คัน/วัน) */
  aadt: number
}

// ── GET /counting/analytic/summary?solution_id={id}&date={YYYY-MM-DD} ────────
// Daily analytic rollup — feeds the 4 stat cards on the วิเคราะห์ปริมาณจราจร
// tab (ปริมาณจราจรประจำวัน / การวิเคราะห์ปริมาณจราจร / การกระจายยานพาหนะ /
// ความหนาแน่นจราจร).

export interface APIRequestTrafficVolumeAnalyticSummary {
  solution_id: string | number
  /** YYYY-MM-DD. Omit to let the backend default to today. */
  date?: string
}

export interface CountingAnalyticTrafficSummary {
  /** Peak hour range, e.g. "17:00-18:00". */
  peak_period: string
  peak_volume: number
  /** ปริมาณการไหล (PCU/ชั่วโมง). */
  traffic_flow: number
  /** Volume-to-Capacity ratio. */
  vc_ratio: number
}

export interface CountingAnalyticTrafficAnalytic {
  total_count: number
  total_pcu: number
  peak_hour: number
  peak_hour_factor: number
}

export interface CountingAnalyticVehicleDistribution {
  /** Top vehicle type, e.g. "รถยนต์". */
  main_vehicle: string
  main_vehicle_count: number
  truck_percent: number
  main_pcu_hour: number
}

export interface CountingAnalyticVehicleDensity {
  /** LOS grade, e.g. "A". */
  level_of_service: string
  /** Flow status label, e.g. "คล่องตัวดีมาก". */
  status: string
  density: string
  service_quality: string
}

export interface APIResponseTrafficVolumeAnalyticSummary {
  traffic_summary: CountingAnalyticTrafficSummary
  traffic_analytic: CountingAnalyticTrafficAnalytic
  vehicle_distribution: CountingAnalyticVehicleDistribution
  vehicle_density: CountingAnalyticVehicleDensity
}

// ── GET /counting/analytic/speed_percentile?solution_id={id}&date=YYYY-MM-DD ─
// Cumulative speed-distribution curve (CDF) — drives the 85th-percentile
// chart on the วิเคราะห์ปริมาณจราจร tab.

export interface APIRequestTrafficVolumeSpeedPercentile {
  solution_id: string | number
  /** YYYY-MM-DD. Omit to let the backend default to today. */
  date?: string
}

export interface CountingSpeedCdfPoint {
  count: number
  cumulative: number
  /** Cumulative percentage (0–100). */
  percentage: number
  /** Speed bucket center (km/h). */
  speed: number
}

export interface CountingSpeedCdfSeries {
  points: CountingSpeedCdfPoint[]
}

/** Each pXX field is an array because the backend may report ties at the
 *  exact percentile boundary; the UI consumes the first element. */
export interface CountingSpeedPercentiles {
  p15: number[]
  p25: number[]
  p50: number[]
  p75: number[]
  p85: number[]
  p95: number[]
}

/** Raw speed-stat rollup — drives the "สถิติความเร็ว" info box.
 *  `_id` is mongo-style grouping artefact (always `null` in this payload). */
export interface CountingSpeedStat {
  _id: string | null
  avgSpeed: number
  count: number
  maxSpeed: number
  minSpeed: number
  stdDev: number
}

export interface APIResponseTrafficVolumeSpeedPercentile {
  cdf: CountingSpeedCdfSeries[]
  percentiles: CountingSpeedPercentiles[]
  stats: CountingSpeedStat[]
}

// ── GET /counting/analytic/graph?solution_id={id}&date=YYYY-MM-DD ────────────
// Hourly volume + 3h moving-average reference — drives the "วิเคราะห์รูปแบบ
// การจราจร" line chart on the วิเคราะห์ปริมาณจราจร tab.

export interface APIRequestTrafficVolumeAnalyticGraph {
  solution_id: string | number
  /** YYYY-MM-DD. Omit to let the backend default to today. */
  date?: string
}

export interface CountingAnalyticGraphPoint {
  /** ISO 8601 hour bucket, e.g. "2026-06-23T00:00:00+07:00". */
  hour_timestamp: string
  /** PCU total for the hour. */
  TotalPCU: number
  /** Vehicle count for the hour — drives the solid blue actual curve. */
  total_count: number
  /** 3-hour moving-average reference — drives the dashed yellow line. */
  ma_3h_total: number
}

/** ลักษณะการไหลของจราจร — flat object with 4 Thai labels.
 *  NOTE: backend field names have typos (`rush_hour_patten`, `taffic_density`);
 *  we mirror them as-is so the types stay aligned with the wire format. */
export interface CountingFlowCharacteristic {
  rush_hour_patten: string
  taffic_density: string
  flow_stability: string
  congestion_level: string
}

/** Per-bucket peak summary shared by morning / evening / off-peak slots. */
export interface CountingPeakBucket {
  period: string
  /** Hour range or descriptor — e.g. "07-09", "Others". */
  time_range: string
  total_volume: number
  avg_volume: number
}

/** Drives the "การกระจายตามช่วงเวลา" info box on the วิเคราะห์ปริมาณจราจร tab. */
export interface CountingPeakTime {
  morning_peak: CountingPeakBucket
  evening_peak: CountingPeakBucket
  off_peak: CountingPeakBucket
  /** Pre-formatted ratio string, e.g. "2.4:1". */
  peak_off_peak_ratio: string
}

/** Drives the "การประเมินคุณภาพการจราจร" assessment row at the bottom of the
 *  วิเคราะห์รูปแบบการจราจร panel. */
export interface CountingTrafficQuality {
  /** LOS grade, e.g. "A". */
  level_of_service: string
  /** Flow status label, e.g. "คล่องตัวดีมาก". */
  status: string
  /** Thai descriptor for variability, e.g. "สูง". */
  traffic_variability: string
  /** Percent (0–100). */
  capacity_utilization: number
  /** Percent (0–100). */
  flow_efficiency: number
}

export interface APIResponseTrafficVolumeAnalyticGraph {
  graph: CountingAnalyticGraphPoint[]
  /** Average hourly volume (คัน/ชั่วโมง). */
  mean: number
  /** Standard deviation of hourly volumes. */
  std_dev: number
  /** Coefficient of variation (ค่าสัมประสิทธิ์ผันแปร, %). */
  cv: number
  /** Peak hour as "HH:mm" — e.g. "17:00". */
  peak_hour: string
  /** Volume during the peak hour (คัน). */
  peak_volume: number
  /** Peak Hour Factor (PHF, ความสม่ำเสมอ). */
  phf: number
  /** Volume-to-Capacity ratio. */
  vc_ratio: number
  capacity: number
  max_traffic: number
  min_traffic: number
  /** Thai-labelled flow characteristics — drives the "ลักษณะการไหลของจราจร" box. */
  flow_characteristic: CountingFlowCharacteristic
  /** Morning / evening / off-peak buckets + ratio — drives the
   *  "การกระจายตามช่วงเวลา" info box. */
  peak_time: CountingPeakTime
  /** LOS grade + status + utilization metrics — drives the
   *  "การประเมินคุณภาพการจราจร" assessment row. */
  traffic_quality: CountingTrafficQuality
}

// ── GET /counting/details/count_previous?solution_id={id}&last={n} ───────────
// Daily totals for the last N days — drives the 7-day comparison bar chart.
// Backend returns the entries in an arbitrary order; sort by `date` on the
// client before plotting.

export interface APIRequestTrafficVolumeCountPrevious {
  solution_id: string | number
  /** How many days back to fetch. Defaults to 7 on the FE. */
  last?: number
}

export interface CountingPreviousDay {
  /** ISO 8601 date at start-of-day, e.g. "2026-06-19T00:00:00Z". */
  date: string
  total: number
}

export type APIResponseTrafficVolumeCountPrevious = CountingPreviousDay[]

// ── GET /counting/departments/{deptId}/cameras?solution_id={id} ──────────────
// Per-solution camera list — drives both the CCTV grid and the detail map's
// marker layer (one marker per camera + centroid for the map view).

export interface APIRequestTrafficVolumeCameras {
  solution_id?: string | number
}

export interface CountingCameraItem {
  id: string
  camera_name: string
  hls_url: string
  /** [lng, lat] — used by the detail map to place a marker per camera. */
  geometry_point: [number, number]
  /** Optional — backend may not expose it on this endpoint yet. */
  ip_address?: string
}

export interface APIResponseTrafficVolumeCameras {
  counting: CountingCameraItem[]
  /** [lng, lat] — average position of the cameras; used to center the map. */
  centroid: [number, number] | null
}

// ── GET /counting/departments/{deptId}/cameras/list ──────────────────────────
// Richer per-solution camera list — drives the CCTV grid + table on the
// detail page. Unlike the `/cameras` endpoint, rows carry `ip_address`,
// `status.is_online`, `last_updated`, and vehicle metadata directly, so the
// UI doesn't need a follow-up per-camera fetch for those fields.
// Paginated with `page` / `limit`; response is enveloped as `{ res_data: [...] }`.

export interface APIRequestTrafficVolumeCamerasList {
  solution_id?: string | number
  /** 1-indexed. Defaults backend-side (screenshot shows 1). */
  page?: number
  /** Rows per page. Screenshot shows 10; the FE passes a larger value to
   *  fetch every camera in a single request since the grid renders all. */
  limit?: number
}

export interface CountingCameraListRoad {
  id: number
  code_name: string
}

export interface CountingCameraListSolution {
  id: number
  solution_name: string
  is_warranty: boolean
}

export interface CountingCameraListStatus {
  is_online: boolean
  /** Thai/EN status label — e.g. "Online". */
  status_name: string
}

export interface CountingCameraListCamera {
  id: string
  camera_name: string
  /** Kilometer-post string, e.g. "0+000". */
  sta: string
  ip_address: string
  hls_url: string
  /** Buddhist-calendar timestamp string, e.g. "04/07/2569 19:59:35". */
  last_updated: string
  status: CountingCameraListStatus
  /** Cumulative vehicle count for the camera. */
  count: number
}

export interface CountingCameraListMainVehicle {
  id: number
  vehicle_name: string
}

export interface CountingCameraListItem {
  road: CountingCameraListRoad
  solution: CountingCameraListSolution
  camera: CountingCameraListCamera
  main_vehicle: CountingCameraListMainVehicle
}

export interface APIResponseTrafficVolumeCamerasList {
  res_data: CountingCameraListItem[]
}

// ── GET /counting/reports/summary?solution_id={id}&start_date=&end_date=… ───
// Aggregated report rows for the รายงานการนับปริมาณจราจร tab. The shape of
// each row depends on `report_type`; the daily/month/year/vehicle_type modes
// all share the same flat row contract below. `camera_id` narrows the rollup
// to a single camera when set (empty string = all cameras).
// Unlike the other counting endpoints, the response is enveloped:
//   { res_data: { data: [...] } }

export type CountingReportType =
  | 'daily'
  | 'hour'
  | 'month'
  | 'year'
  | 'vehicle_type'

export interface APIRequestTrafficVolumeReportSummary {
  solution_id: string | number
  /** YYYY-MM-DD inclusive lower bound. */
  start_date: string
  /** YYYY-MM-DD inclusive upper bound. */
  end_date: string
  report_type: CountingReportType
  /** Empty string / undefined = aggregate across all cameras. */
  camera_id?: string | number
  /** 1-indexed page. Defaults backend-side. */
  page?: number
  /** Rows per page. Defaults backend-side. */
  limit?: number
}

/** One row of the report. Field meanings:
 *  • `date`  — ISO 8601 timestamp (e.g. "2026-06-24T00:00:00Z") for daily,
 *              hour-bucketed for hourly ("2026-06-24T20:00:00+07:00"), etc.
 *  • `label` — Thai weekday for daily ("วันพุธ"); hour string for hourly
 *              ("20:00"); month/year report types may reuse for their labels.
 *  • `camera_name` — present only on `report_type=hour`; lets the UI group
 *                    rows under their source camera in the hourly table.
 *  • `percent_truck` — share in the **0–100** range already (2.24 = 2.24%),
 *                      display as-is without further multiplication. */
export interface CountingReportSummaryRow {
  date: string
  label: string
  camera_name?: string
  bike_count: number
  car_count: number
  truck_count: number
  bus_count: number
  taxi_count: number
  pickup_count: number
  trailer_count: number
  total_count: number
  total_pcu: number
  percent_truck: number
  peak_pcu: number
}

/** Pre-aggregated per-vehicle-type row returned by the report endpoint
 *  when `report_type=vehicle_type`. Unlike the date/hour-bucketed rows,
 *  this shape has no `date` — each entry summarises one vehicle category
 *  across the requested date range.
 *
 *  Field meanings:
 *  • `vehicle_type` — Thai label, e.g. "จักรยานยนต์" (sometimes without
 *    the "รถ" prefix the rest of the UI uses).
 *  • `percent` — share in the **0–100** range (NOT 0–1 like
 *    `percent_truck` on the bucketed row shape).
 *  • `avg_hour` / `peak_hour` — PCU per hour (mean / max) for that
 *    vehicle category. */
export interface CountingVehicleTypeAggRow {
  vehicle_type: string
  total_count: number
  total_pcu: number
  pcu_factor: number
  percent: number
  avg_hour: number
  peak_hour: number
}

/** Either row shape the `/counting/reports/summary` endpoint returns,
 *  depending on `report_type`. Callers narrow with a type-guard. */
export type CountingReportRow =
  | CountingReportSummaryRow
  | CountingVehicleTypeAggRow

/** Pre-computed KPI strip the backend returns alongside `data` on the
 *  vehicle-type report. Currently observed only for `report_type=vehicle_type`;
 *  other modes omit it. Field meanings:
 *  • `count` — number of vehicle-type rows in `data` (matches the table
 *    "จำนวนรายการ" cell).
 *  • `main_vehicle_type_percent` / `percent_normal_vehicle` /
 *    `percent_truck_vehicle` — all in **0–100** range. */
export interface CountingVehicleTypeAPISummary {
  count: number
  total_count: number
  total_pcu: number
  main_vehicle_type: string
  main_vehicle_type_percent: number
  percent_normal_vehicle: number
  percent_truck_vehicle: number
  truck_count: number
}

export interface APIResponseTrafficVolumeReportSummary {
  res_data: {
    data: CountingReportRow[]
    /** Present on `report_type=vehicle_type`; absent on date-bucketed
     *  modes (which roll up client-side from the row data). */
    summary?: CountingVehicleTypeAPISummary
  }
}
