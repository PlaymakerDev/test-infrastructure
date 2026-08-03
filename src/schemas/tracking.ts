import { z } from 'zod'
import type {
  APIResponseCalibrationHistoryStatus,
  APIResponseLast7Days,
  APIResponseMobileCar,
  APIResponseMobileDailyCount,
  APIResponseMobileMaster,
  APIResponseMobileMasterDepartmentByTID,
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
  MobileCarData,
  MobileCarList,
  MobileDailyCountData,
  MobileMasterData,
  MobileMasterDepartmentByTIDData,
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
import type {
  AllDailySum,
  AllDepartmentData,
  APIResponseTrackingAllDepartment,
  APIResponseTrackingCCTVList,
  APIResponseTrackingCollaboration,
  APIResponseTrackingDailySum,
  APIResponseTrackingMobileMaster,
  APIResponseTrackingPosition,
  APIResponseTrackingSumStation,
  APIResponseTrackingSumWeightYearV2,
  APIResponseTrackingSumWim,
  APIResponseTrackingTotalStation,
  APIResponseTrackingViewSumPlanChart,
  APIResponseTrackingWeightInspection,
  CCTVList,
  CollaborationData,
  DailySumItem,
  MobileMasterData as OverallMobileMasterData,
  PositionLocation,
  PositionMobile,
  PositionStation,
  PositionWim,
  SumStation,
  SumWeightData,
  SumWeightSummary,
  SumWeightYearData,
  SumWim,
  TotalMobile,
  TotalStation,
  TotalWim,
  ViewSumPlanChartAllSum,
  ViewSumPlanChartItem,
  WeightInspectionData,
} from '@/types/tracking/overall-api'
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

// ── MOBILE DAILY STATUS COUNT (tracking/detail/mobile) ──────────────────────

const mobileDailyCountDataSchema = z.object({
  actual: z.number(),
  axis_over_gross_weight: z.number(),
  fiscal_year: z.number(),
  max_grossweight_not_over: z.number(),
  max_grossweight_over: z.number(),
  max_grossweight_over_percent: z.number(),
  open_station_count: z.number(),
  plan: z.number(),
  sum_total: z.number(),
  sum_total_over: z.number(),
  top_region: z.any(),
  top_region_open_count: z.number(),
  top_region_percent: z.number(),
  total_station_count: z.number(),
  weight_axis_over_count: z.number(),
}) satisfies z.ZodType<MobileDailyCountData>

export const apiResponseMobileDailyCountSchema = z.object({
  success: z.boolean(),
  data: mobileDailyCountDataSchema,
}) satisfies z.ZodType<APIResponseMobileDailyCount>

// ── MOBILE MASTER DEPARTMENT BY TID ─────────────────────────────────────────

const mobileMasterDepartmentByTIDDataSchema = z.object({
  FirstName: z.string(),
  LastName: z.string(),
  Title: z.string(),
  Total: z.string(),
  TotalOver: z.string(),
  collaboration: z.string(),
  create_by: z.string(),
  create_date: z.string(),
  dept_id: z.number(),
  dept_province: z.string(),
  district: z.string(),
  image_name1: z.string(),
  image_name2: z.string(),
  image_path1: z.string(),
  image_path2: z.string(),
  is_open: z.number(),
  km_from: z.string(),
  km_to: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  province: z.string(),
  sub_district: z.string(),
  tid: z.string(),
  time_from: z.string(),
  time_to: z.string(),
  way_id: z.string(),
  way_name: z.string(),
}) satisfies z.ZodType<MobileMasterDepartmentByTIDData>

export const apiResponseMobileMasterDepartmentByTIDSchema = z.object({
  success: z.boolean(),
  data: mobileMasterDepartmentByTIDDataSchema,
}) satisfies z.ZodType<APIResponseMobileMasterDepartmentByTID>

// ── MOBILE CAR ────────────────────────────────────────────────────────────

const mobileCarListSchema = z.object({
  accept_weight: z.any(),
  accept_weight_by: z.any(),
  arrest_id: z.any(),
  create_date: z.string(),
  // Required since 773a23a (Playmaker, 2026-07-25) flipped the field on
  // MobileCarList — schema follows the type (compile-checked fixture).
  drive_shaft_over: z.string(),
  driver_name: z.any(),
  driver_shaft: z.string(),
  ds_1: z.string(),
  ds_2: z.string(),
  ds_3: z.string(),
  ds_4: z.string(),
  ds_5: z.string(),
  ds_6: z.string(),
  ds_7: z.any(),
  gross_weight: z.string(),
  gross_weight_over: z.any(),
  image_path0: z.string(),
  image_path1: z.string(),
  image_path2: z.string(),
  image_path3: z.string(),
  image_path4: z.string(),
  image_path5: z.string(),
  image_path6: z.string(),
  is_arrested: z.number(),
  is_over_weight: z.string(),
  is_over_weight_desc: z.string(),
  legal_weight: z.string(),
  lp_head: z.string(),
  lp_head_no: z.string(),
  lp_head_province_id: z.number(),
  lp_head_province_id_ppa: z.number(),
  lp_head_province_name: z.string(),
  lp_tail: z.string(),
  lp_tail_no: z.string(),
  lp_tail_province_id: z.number(),
  lp_tail_province_id_ppa: z.number(),
  lp_tail_province_name: z.string(),
  masterial_name: z.string(),
  t_id: z.string(),
  td_id: z.string(),
  tdid_sort: z.number(),
  vehicle_class_desc: z.string(),
  vehicle_class_desc2: z.string(),
  vehicle_class_desc3: z.string(),
  vehicle_class_id: z.number(),
  vehicle_class_id_ref: z.number(),
  vehicle_class_legal_drive_shaft: z.string(),
  vehicle_class_legal_drive_shaft_ref: z.string(),
  vehicle_class_legal_weight: z.string(),
  vehicle_class_name: z.string(),
}) satisfies z.ZodType<MobileCarList>

// MobileCarMetaData = WIMMetaData + axis/total over counters (773a23a).
const mobileCarMetaDataSchema = wimMetaDataSchema.extend({
  axis_over: z.number(),
  total: z.number(),
  total_over: z.number(),
})

const mobileCarDataSchema = z.object({
  data: z.array(mobileCarListSchema),
  meta: mobileCarMetaDataSchema,
}) satisfies z.ZodType<MobileCarData>

export const apiResponseMobileCarSchema = z.object({
  success: z.boolean(),
  data: mobileCarDataSchema,
}) satisfies z.ZodType<APIResponseMobileCar>

// ── MOBILE MASTER ─────────────────────────────────────────────────────────

const mobileMasterDataSchema = z.object({
  TID: z.string(),
  DeptID: z.number(),
  DeptName: z.string(),
  Collaboration: z.string(),
  DeptProvince: z.string(),
  WayID: z.string(),
  WayName: z.string(),
  Subdistrict: z.string(),
  District: z.string(),
  Province: z.string(),
  CreateBy: z.string(),
  Title: z.string(),
  FirstName: z.string(),
  LastName: z.string(),
  image_name1: z.string(),
  image_path1: z.string(),
  image_name2: z.string(),
  image_path2: z.string(),
  CreateDate: z.string(),
  TimeFrom: z.string(),
  // `any` on the type (BE may send null) — mirror it.
  TimeTo: z.any(),
  IsOpen: z.number(),
  Total: z.string(),
  TotalOver: z.string(),
  // Added by 773a23a (Playmaker, 2026-07-25) — axis/total overweight rollups.
  AxisOver: z.string(),
  TotalOverWeight: z.string(),
  KMFrom: z.string(),
  KMTo: z.string(),
}) satisfies z.ZodType<MobileMasterData>

export const apiResponseMobileMasterSchema = z.object({
  success: z.boolean(),
  data: z.array(mobileMasterDataSchema),
  meta: wimMetaDataSchema,
}) satisfies z.ZodType<APIResponseMobileMaster>

// ── DAILY SUM (tracking/overall) ────────────────────────────────────────────

const allDailySumSchema = z.object({
  over: z.number(),
  total: z.number(),
}) satisfies z.ZodType<AllDailySum>

const dailySumItemSchema = z.object({
  create_date: z.string(),
  over: z.string(),
  station_type: z.number(),
  station_type_desc: z.string(),
  station_type_eng: z.string(),
  total: z.string(),
}) satisfies z.ZodType<DailySumItem>

export const apiResponseTrackingDailySumSchema = z.object({
  success: z.boolean(),
  data: z.object({
    all_sum: allDailySumSchema,
    items: z.array(dailySumItemSchema),
  }),
}) satisfies z.ZodType<APIResponseTrackingDailySum>

// ── TOTAL STATION ────────────────────────────────────────────────────────────

const totalMobileSchema = z.object({
  total: z.string(),
  open: z.string(),
}) satisfies z.ZodType<TotalMobile>

const totalWimSchema = z.object({
  open: z.string(),
  total: z.string(),
}) satisfies z.ZodType<TotalWim>

const totalStationSchema = z.object({
  open: z.string(),
  total: z.string(),
}) satisfies z.ZodType<TotalStation>

export const apiResponseTrackingTotalStationSchema = z.object({
  mobile: totalMobileSchema,
  wim: totalWimSchema,
  station: totalStationSchema,
}) satisfies z.ZodType<APIResponseTrackingTotalStation>

// ── WEIGHT INSPECTION ────────────────────────────────────────────────────────

const weightInspectionDataSchema = z.object({
  create_date: z.string(),
  date_value: z.string(),
  over: z.string(),
  over_title: z.string(),
  total: z.string(),
  total_title: z.string(),
}) satisfies z.ZodType<WeightInspectionData>

export const apiResponseTrackingWeightInspectionSchema = z.object({
  data: z.array(weightInspectionDataSchema),
  success: z.boolean(),
}) satisfies z.ZodType<APIResponseTrackingWeightInspection>

// ── SUM WEIGHT YEAR V2 ───────────────────────────────────────────────────────

const sumWeightDataSchema = z.object({
  all_total: z.number(),
  arrest_total: z.number(),
  judge_total: z.number(),
  note: z.string().optional(),
  plan_total: z.number(),
  result_total: z.number(),
  spot_check_total: z.number(),
  station_total: z.number(),
  way_id_total: z.number(),
  wim_total: z.number(),
  year_total: z.number(),
}) satisfies z.ZodType<SumWeightData>

const sumWeightSummarySchema = z.object({
  all_total: z.string(),
  arrest_total: z.string(),
  judge_total: z.string(),
  note: z.string(),
  plan_total: z.string(),
  result_total: z.string(),
  spot_check_total: z.string(),
  station_total: z.string(),
  way_id_total: z.string(),
  wim_total: z.string(),
  year_total: z.string(),
}) satisfies z.ZodType<SumWeightSummary>

const sumWeightYearDataSchema = z.object({
  data: z.array(sumWeightDataSchema),
  summary: z.array(sumWeightSummarySchema),
}) satisfies z.ZodType<SumWeightYearData>

export const apiResponseTrackingSumWeightYearV2Schema = z.object({
  data: sumWeightYearDataSchema,
  success: z.boolean(),
}) satisfies z.ZodType<APIResponseTrackingSumWeightYearV2>

// ── VIEW SUM PLAN CHART ──────────────────────────────────────────────────────

const viewSumPlanChartAllSumSchema = z.object({
  plan_total: z.number(),
  result_total: z.number(),
}) satisfies z.ZodType<ViewSumPlanChartAllSum>

const viewSumPlanChartItemSchema = z.object({
  month: z.string(),
  plan: z.number(),
  result: z.number(),
  year: z.string(),
}) satisfies z.ZodType<ViewSumPlanChartItem>

export const apiResponseTrackingViewSumPlanChartSchema = z.object({
  all_sum: viewSumPlanChartAllSumSchema,
  item: z.array(viewSumPlanChartItemSchema),
  plan_year: z.string(),
}) satisfies z.ZodType<APIResponseTrackingViewSumPlanChart>

// ── POSITION ─────────────────────────────────────────────────────────────────

const positionStationSchema = z.object({
  StationID: z.number(),
  StationName: z.string(),
  StationDescription: z.string(),
  LocationDescription: z.string(),
  Latitude: z.string(),
  Longtitude: z.string(),
  isEnable: z.number(),
  Total: z.number(),
  Over: z.number(),
}) satisfies z.ZodType<PositionStation>

const positionWimSchema = z.object({
  StationID: z.number(),
  StationName: z.string(),
  StationDescription: z.string(),
  LocationDescription: z.string(),
  Latitude: z.string(),
  Longtitude: z.string(),
  isEnable: z.number(),
  Total: z.number(),
  Over: z.number(),
}) satisfies z.ZodType<PositionWim>

const positionMobileSchema = z.object({
  TID: z.number(),
  Latitude: z.string(),
  Longtitude: z.string(),
  WayID: z.string(),
  first_name: z.string(),
  last_name: z.string(),
}) satisfies z.ZodType<PositionMobile>

const positionLocationSchema = z.object({
  latitude: z.string().optional(),
  longitude: z.string().optional(),
}) satisfies z.ZodType<PositionLocation>

export const apiResponseTrackingPositionSchema = z.object({
  station: z.array(positionStationSchema),
  wim: z.array(positionWimSchema),
  mobile: z.array(positionMobileSchema),
  location: z.array(positionLocationSchema),
}) satisfies z.ZodType<APIResponseTrackingPosition>

// ── SUM STATION ──────────────────────────────────────────────────────────────

const sumStationSchema = z.object({
  station_id: z.number(),
  name: z.string(),
  station_type: z.number(),
  delivery_year: z.string(),
  update_year: z.any(),
  kilometer_position: z.any(),
  contract_number: z.any(),
  contractor_name: z.any(),
  station_type_desc: z.string(),
  station_type_eng: z.string(),
  create_date: z.string(),
  total: z.string(),
  over: z.string(),
  total_cctv: z.string(),
  offline_cctv: z.string(),
}) satisfies z.ZodType<SumStation>

export const apiResponseTrackingSumStationSchema = z.object({
  success: z.boolean(),
  data: z.array(sumStationSchema),
}) satisfies z.ZodType<APIResponseTrackingSumStation>

// ── SUM WIM ──────────────────────────────────────────────────────────────────

const sumWimSchema = z.object({
  station_id: z.number(),
  name: z.string(),
  station_type: z.number(),
  delivery_year: z.string().optional(),
  update_year: z.string().optional(),
  kilometer_position: z.string().optional(),
  contract_number: z.string().optional(),
  contractor_name: z.string().optional(),
  station_type_desc: z.string(),
  station_type_eng: z.string(),
  create_date: z.string(),
  total: z.string(),
  over: z.string(),
  over_10percent: z.string(),
  total_cctv: z.string(),
  offline_cctv: z.string(),
}) satisfies z.ZodType<SumWim>

export const apiResponseTrackingSumWimSchema = z.object({
  success: z.boolean(),
  data: z.array(sumWimSchema),
}) satisfies z.ZodType<APIResponseTrackingSumWim>

// ── COLLABORATION ────────────────────────────────────────────────────────────

const collaborationDataSchema = z.object({
  uid: z.number(),
  t_id: z.string(),
  image_path1: z.string(),
  image_path2: z.string(),
  image_name1: z.string(),
  image_name2: z.string(),
  way_id: z.number(),
  way_code: z.string(),
  collaboration: z.string(),
  department_id: z.number(),
  department_name: z.string(),
  department_province: z.string(),
  department_name2: z.string(),
  create_date: z.string(),
}) satisfies z.ZodType<CollaborationData>

export const apiResponseTrackingCollaborationSchema = z.object({
  success: z.boolean(),
  data: z.array(collaborationDataSchema),
  meta: wimMetaDataSchema,
}) satisfies z.ZodType<APIResponseTrackingCollaboration>

// ── MOBILE MASTER (tracking/overall — distinct from detail/mobile's own copy) ─

const trackingMobileMasterDataSchema = z.object({
  TID: z.string(),
  DeptID: z.number(),
  DeptName: z.string(),
  Collaboration: z.string(),
  DeptProvince: z.string(),
  WayID: z.string(),
  WayName: z.string(),
  Subdistrict: z.string(),
  District: z.string(),
  Province: z.string(),
  CreateBy: z.string(),
  Title: z.string(),
  FirstName: z.string(),
  LastName: z.string(),
  image_name1: z.string().optional(),
  image_path1: z.string().optional(),
  image_name2: z.string().optional(),
  image_path2: z.string().optional(),
  CreateDate: z.string(),
  TimeFrom: z.string(),
  TimeTo: z.any(),
  IsOpen: z.number(),
  Total: z.string(),
  TotalOver: z.string(),
  KMFrom: z.string(),
  KMTo: z.string(),
}) satisfies z.ZodType<OverallMobileMasterData>

export const apiResponseTrackingMobileMasterSchema = z.object({
  success: z.boolean(),
  data: z.array(trackingMobileMasterDataSchema),
  meta: wimMetaDataSchema,
}) satisfies z.ZodType<APIResponseTrackingMobileMaster>

// ── ALL DEPARTMENT ───────────────────────────────────────────────────────────

const allDepartmentDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.number(),
  group: z.number(),
  province: z.string(),
  group_drr: z.number(),
  station_id: z.any(),
  office_no: z.number().optional(),
  name2: z.string(),
  contract_number: z.any(),
  contractor_name: z.any(),
  remark: z.any(),
}) satisfies z.ZodType<AllDepartmentData>

export const apiResponseTrackingAllDepartmentSchema = z.object({
  success: z.boolean(),
  data: z.array(allDepartmentDataSchema),
}) satisfies z.ZodType<APIResponseTrackingAllDepartment>
