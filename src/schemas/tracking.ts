import { z } from 'zod'
import type {
  APIResponseCalibrationHistoryStatus,
  APIResponseLast7Days,
  APIResponsePCU,
  APIResponsePositionByID,
  APIResponseStationByID,
  APIResponseStationDaily,
  APIResponseTrafficAvgSpeed,
  APIResponseWeightStationLog,
  APIResponseWeightWIMLog,
  APIResponseWIMByID,
  APIResponseWIMDaily,
  CalibrateStation,
  CalibrateWIM,
  LatestCalibration,
  MetaSummary,
  PCUData,
  PositionByIDData,
  StationData,
  StationDailyData,
  TrafficAvgSpeedData,
  WeightStationLogData,
  WeightWIMLogData,
  WeightWIMLogMeta,
  WIMData,
  WIMDailyData,
} from '@/types/tracking/detail-api'
import type { APIResponseTrackingCCTVList, CCTVList } from '@/types/tracking/overall-api'
import type { WIMMetaData } from '@/types/shared'

// ── Shared sub-schemas ──────────────────────────────────────────────────────

/** `WIMMetaData` — distinct shape from `shared.ts`'s `metaDataSchema`
 *  (`{count,page,limit,total_pages}`); tracking's pagination envelope uses
 *  `has_next_page`/`has_previous_page`/`page_count`/`page_size`/`total`. */
export const wimMetaDataSchema = z.object({
  has_next_page: z.boolean(),
  has_previous_page: z.boolean(),
  page: z.number(),
  page_count: z.number(),
  page_size: z.number(),
  total: z.number(),
}) satisfies z.ZodType<WIMMetaData>

const stationDataSchema = z.object({
  station_id: z.number(),
  station_name: z.string(),
  station_description: z.string(),
  location_description: z.string(),
  station_type: z.number(),
  province_id: z.number(),
  latitude: z.string(),
  longtitude: z.string(),
  total: z.number(),
  over: z.number(),
  is_enable: z.number(),
  enf_id: z.any(),
  ip_address: z.string(),
  last_update: z.string(),
  department_id: z.number(),
  delivery_year: z.string(),
  update_year: z.any(),
  kilometer_position: z.any(),
  side: z.any(),
  contract_number: z.any(),
  contractor_name: z.any(),
  remark: z.any(),
}) satisfies z.ZodType<StationData>

const wimDataSchema = z.object({
  station_id: z.number(),
  station_name: z.string(),
  station_description: z.string(),
  location_description: z.string(),
  station_type: z.number(),
  province_id: z.number(),
  latitude: z.string(),
  longtitude: z.string(),
  total: z.number(),
  over: z.number(),
  is_enable: z.number(),
  enf_id: z.any(),
  ip_address: z.string(),
  last_update: z.string(),
  owner: z.string(),
  department_id: z.number(),
  delivery_year: z.any(),
  update_year: z.any(),
  kilometer_position: z.any(),
  side: z.any(),
  contract_number: z.any(),
  contractor_name: z.any(),
  remark: z.any(),
}) satisfies z.ZodType<WIMData>

// ── STATION BY ID / WIM BY ID ────────────────────────────────────────────────

export const apiResponseStationByIDSchema = z.object({
  success: z.boolean(),
  data: stationDataSchema,
}) satisfies z.ZodType<APIResponseStationByID>

export const apiResponseWIMByIDSchema = z.object({
  success: z.boolean(),
  data: wimDataSchema,
}) satisfies z.ZodType<APIResponseWIMByID>

// ── POSITION BY ID ───────────────────────────────────────────────────────────

const positionByIDDataSchema = z.object({
  StationID: z.number(),
  Latitude: z.string(),
  Longtitude: z.string(),
  StationName: z.string(),
  StationDescription: z.string(),
  LocationDescription: z.string(),
  isEnable: z.number(),
  Total: z.number(),
  Over: z.number(),
}) satisfies z.ZodType<PositionByIDData>

export const apiResponsePositionByIDSchema = z.array(
  positionByIDDataSchema,
) satisfies z.ZodType<APIResponsePositionByID>

// ── PCU ──────────────────────────────────────────────────────────────────────

const pcuDataSchema = z.object({
  total_pcu: z.string(),
  percent_truck: z.string(),
  aadt: z.string(),
}) satisfies z.ZodType<PCUData>

export const apiResponsePCUSchema = z.object({
  success: z.boolean(),
  data: pcuDataSchema,
}) satisfies z.ZodType<APIResponsePCU>

// ── CALIBRATION HISTORY STATUS ──────────────────────────────────────────────

const calibrateStationSchema = z.object({
  station_id: z.number(),
  station_name: z.string(),
  station_description: z.string(),
  location_description: z.string(),
  station_type: z.number(),
  province_id: z.number(),
  latitude: z.string(),
  longtitude: z.string(),
  total: z.number(),
  over: z.number(),
  is_enable: z.number(),
  enf_id: z.any(),
  ip_address: z.string(),
  last_update: z.string(),
  department_id: z.number(),
  delivery_year: z.string(),
  update_year: z.any(),
  kilometer_position: z.any(),
  side: z.any(),
  contract_number: z.any(),
  contractor_name: z.any(),
  remark: z.any(),
}) satisfies z.ZodType<CalibrateStation>

const calibrateWIMSchema = z.object({
  station_id: z.number(),
  station_name: z.string(),
  station_description: z.string(),
  location_description: z.string(),
  station_type: z.number(),
  province_id: z.number(),
  latitude: z.string(),
  longtitude: z.string(),
  total: z.number(),
  over: z.number(),
  is_enable: z.number(),
  enf_id: z.any(),
  ip_address: z.string(),
  last_update: z.string(),
  owner: z.string(),
  department_id: z.number(),
  delivery_year: z.string(),
  update_year: z.string(),
  kilometer_position: z.string(),
  side: z.string(),
  contract_number: z.string(),
  contractor_name: z.string(),
  remark: z.string(),
}) satisfies z.ZodType<CalibrateWIM>

const latestCalibrationSchema = z.object({
  id: z.number(),
  stationType: z.number(),
  stationId: z.number(),
  departmentId: z.any(),
  calibrationDate: z.string(),
  calibrationBy: z.string(),
  calibrationCompany: z.string(),
  certificateNo: z.string(),
  nextCalibrationDate: z.string(),
  calibrationResult: z.string(),
  remark: z.string(),
  attachmentPath: z.any(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedBy: z.any(),
  updatedAt: z.string(),
  station: calibrateStationSchema,
  wim: calibrateWIMSchema,
}) satisfies z.ZodType<LatestCalibration>

export const apiResponseCalibrationHistoryStatusSchema = z.object({
  status: z.string(),
  latestCalibration: latestCalibrationSchema,
  daysUntilExpiry: z.number(),
}) satisfies z.ZodType<APIResponseCalibrationHistoryStatus>

// ── STATION DAILY / WIM DAILY ───────────────────────────────────────────────

const stationDailyDataSchema = z.object({
  isover_10percent: z.number(),
  remark: z.string(),
  station_id: z.number(),
  station_name: z.string(),
  total: z.number(),
  total_over: z.number(),
  date_time: z.string(),
  date_time_ct: z.string(),
}) satisfies z.ZodType<StationDailyData>

export const apiResponseStationDailySchema = z.object({
  success: z.boolean(),
  is_over10percent_count: z.number(),
  data: z.array(stationDailyDataSchema),
  meta: wimMetaDataSchema,
}) satisfies z.ZodType<APIResponseStationDaily>

const wimDailyDataSchema = z.object({
  isover_10percent: z.number(),
  avg_esal: z.string(),
  max_esal: z.string(),
  remark: z.string(),
  station_id: z.number(),
  station_name: z.string(),
  total: z.number(),
  total_over: z.number(),
  date_time: z.string(),
  date_time_ct: z.string(),
}) satisfies z.ZodType<WIMDailyData>

export const apiResponseWIMDailySchema = z.object({
  success: z.boolean(),
  is_over10percent_count: z.number(),
  data: z.array(wimDailyDataSchema),
  meta: wimMetaDataSchema,
}) satisfies z.ZodType<APIResponseWIMDaily>

// ── LAST 7 DAYS ──────────────────────────────────────────────────────────────

export const apiResponseLast7DaysSchema = z.object({
  column: z.array(z.string()),
  total: z.array(z.number()),
  over: z.array(z.number()),
  esal: z.array(z.number()),
}) satisfies z.ZodType<APIResponseLast7Days>

// ── WEIGHT WIM LOG / WEIGHT STATION LOG ─────────────────────────────────────

const metaSummarySchema = z.object({
  total: z.number(),
  overweight: z.number(),
  is_over_10_percent: z.number(),
}) satisfies z.ZodType<MetaSummary>

/** Reused by both weight-wim-log and weight-station-log responses — the two
 *  endpoints share this exact meta envelope. */
export const weightWIMLogMetaSchema = z.object({
  page: z.number(),
  total: z.number(),
  page_size: z.string(),
  page_count: z.number(),
  has_previous_page: z.boolean(),
  has_next_page: z.boolean(),
  summary: metaSummarySchema,
}) satisfies z.ZodType<WeightWIMLogMeta>

const weightWIMLogDataSchema = z.object({
  td_id: z.string(),
  t_id: z.string(),
  time_stamp: z.string(),
  time_stamp_date: z.string(),
  time_stamp_time: z.string(),
  today: z.string(),
  enf_id: z.string(),
  station_id: z.number(),
  station_name: z.string(),
  vehicle_class_id: z.number(),
  metrial_name: z.any(),
  lp_head_no: z.string(),
  lp_head_province_id: z.string(),
  province_name: z.string(),
  lp_tail_no: z.any(),
  lp_tail_province_id: z.any(),
  gross_weight: z.string(),
  gross_weight_over: z.string(),
  legal_weight: z.string(),
  over10percent: z.string(),
  axle_left_01: z.any(),
  axle_left_02: z.any(),
  axle_left_03: z.any(),
  axle_left_04: z.any(),
  axle_left_05: z.any(),
  axle_left_06: z.any(),
  axle_left_07: z.any(),
  axle_right_01: z.any(),
  axle_right_02: z.any(),
  axle_right_03: z.any(),
  axle_right_04: z.any(),
  axle_right_05: z.any(),
  axle_right_06: z.any(),
  axle_right_07: z.any(),
  display_type: z.number(),
  is_over_weight: z.string(),
  driver_name: z.any(),
  image_02_name: z.string(),
  image_01_name: z.string(),
  vehicle_class_desc2: z.string(),
  vehicle_class_desc3: z.string(),
  lp_head_province_name: z.string(),
  lp_head_province_id_ppa: z.number(),
  lp_tail_province_name: z.any(),
  lp_tail_province_id_ppa: z.any(),
  is_arrested: z.any(),
  vehicle_class_name: z.string(),
  vehicle_class_desc: z.string(),
  vehicle_class_legal_weight: z.string(),
  vehicle_class_legal_drive_shaft: z.string(),
  vehicle_class_legal_drive_shaft_ref: z.string(),
  vehicle_class_id_ref: z.number(),
  axle_01_weight: z.any(),
  axle_02_weight: z.any(),
  axle_03_weight: z.any(),
  axle_04_weight: z.any(),
  axle_05_weight: z.any(),
  axle_06_weight: z.any(),
  axle_07_weight: z.any(),
  axle_08_weight: z.any(),
  axle_09_weight: z.any(),
  axle_10_weight: z.any(),
  axle_11_weight: z.any(),
  axle_12_weight: z.any(),
  axle_13_weight: z.any(),
  axle_14_weight: z.any(),
  axle_count: z.string(),
  is_over_weight_desc: z.string(),
}) satisfies z.ZodType<WeightWIMLogData>

export const apiResponseWeightWIMLogSchema = z.object({
  data: z.array(weightWIMLogDataSchema),
  meta: weightWIMLogMetaSchema,
}) satisfies z.ZodType<APIResponseWeightWIMLog>

/** `grossweight_over` (no underscore) — NOT `gross_weight_over` like
 *  `WeightWIMLogData` above. This field-name mismatch between the WIM and
 *  STATION log endpoints is exactly why `useDailyWeightLog` normalizes both
 *  shapes before handing data to components. Do not "fix" this to match the
 *  WIM field name — it mirrors what the STATION endpoint actually returns. */
const weightStationLogDataSchema = z.object({
  td_id: z.string(),
  t_id: z.string(),
  time_stamp: z.string(),
  enf_id: z.string(),
  station_id: z.number(),
  station_name: z.string(),
  vehicle_class_id: z.number(),
  meterial_name: z.any(),
  lp_head_no: z.string(),
  lp_head_province_id: z.string(),
  province_name: z.string(),
  lp_tail_no: z.any(),
  lp_tail_province_id: z.any(),
  gross_weight: z.string(),
  grossweight_over: z.string(),
  legal_weight: z.string(),
  axle_left_01: z.any(),
  axle_left_02: z.any(),
  axle_left_03: z.any(),
  axle_left_04: z.any(),
  axle_left_05: z.any(),
  axle_left_06: z.any(),
  axle_left_07: z.any(),
  axle_right_01: z.any(),
  axle_right_02: z.any(),
  axle_right_03: z.any(),
  axle_right_04: z.any(),
  axle_right_05: z.any(),
  axle_right_06: z.any(),
  axle_right_07: z.any(),
  display_type: z.number(),
  is_over_weight: z.string(),
  drive_name: z.any(),
  lp_head_province_name: z.string(),
  lp_head_province_id_ppa: z.number(),
  lp_tail_province_name: z.any(),
  lp_tail_province_id_ppa: z.any(),
  vehicle_class_name: z.string(),
  vehicle_class_desc2: z.string(),
  vehicle_class_desc3: z.string(),
  vehicle_class_desc: z.string(),
  vehicle_class_legal_weight: z.string(),
  vehicle_class_legal_drive_shaft: z.string(),
  vehicle_class_legal_drive_shaft_ref: z.string(),
  vehicle_class_id_ref: z.number(),
  is_over_weight_desc: z.string(),
}) satisfies z.ZodType<WeightStationLogData>

export const apiResponseWeightStationLogSchema = z.object({
  data: z.array(weightStationLogDataSchema),
  meta: weightWIMLogMetaSchema,
}) satisfies z.ZodType<APIResponseWeightStationLog>

// ── TRAFFIC AVG SPEED ────────────────────────────────────────────────────────

const trafficAvgSpeedDataSchema = z.object({
  pid: z.number(),
  period: z.string(),
  period_name: z.string(),
  vehicle_count: z.string(),
  avg_speed: z.string(),
}) satisfies z.ZodType<TrafficAvgSpeedData>

export const apiResponseTrafficAvgSpeedSchema = z.array(
  trafficAvgSpeedDataSchema,
) satisfies z.ZodType<APIResponseTrafficAvgSpeed>

// ── CCTV LIST (tracking/overall-api, shared by detail/wim's OverallCCTV) ───

const cctvListItemSchema = z.object({
  camera_description: z.string(),
  camera_ip: z.string(),
  camera_status: z.string(),
  camera_type: z.string(),
  department_id: z.number(),
  department_name: z.string(),
  id: z.number(),
  last_update: z.string(),
  station_description: z.string(),
  station_id: z.number(),
  station_type_desc: z.string(),
  station_type_id: z.number(),
  station_type_name: z.string(),
  stream_url: z.string(),
}) satisfies z.ZodType<CCTVList>

export const apiResponseTrackingCCTVListSchema = z.object({
  data: z.array(cctvListItemSchema),
  meta: wimMetaDataSchema,
  success: z.boolean(),
}) satisfies z.ZodType<APIResponseTrackingCCTVList>
