import { z } from 'zod'
import type {
  APIResponseDeleteVMSSettingType,
  APIResponsePostVMSSettingType,
  APIResponsePutVMSSettingType,
  APIResponseVMSDepartment,
  APIResponseVMSMedia,
  APIResponseVMSSettingType,
  VMSMediaList,
  VMSSettingType,
} from '@/types/control-vms/vms-api'
import type {
  APIResponsePostVMSBatchDelete,
  APIResponseVMSMediaById,
  APIResponseVMSScheduleByDate,
  APIResponseVMSSettingByRoad,
  APIResponseVMSSettingByStatus,
  APIResponseVMSSettingByVMSID,
  APIResponseVMSSettingList,
  APIResponseVMSSettingStatusCount,
  APIResponseVMSUpcomingSummary,
  ScheduleByVMSID,
  VMSScheduleByDate,
  VMSSettingList,
} from '@/types/control-vms/display-api'
import { apiResponsePostSchema, metaDataSchema } from './shared'

// ── Setting type ────────────────────────────────────────────────────────────
export const vmsSettingTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
}) satisfies z.ZodType<VMSSettingType>

export const apiResponseVMSSettingTypeSchema = z.array(
  vmsSettingTypeSchema,
) satisfies z.ZodType<APIResponseVMSSettingType>

// ── Departments tree ─────────────────────────────────────────────────────────
const sharedProjectSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  project_name: z.string().optional(),
  budget_year: z.number(),
  contract_no: z.string(),
})

const solutionSchema = z.object({
  vms_id: z.number(),
  solution_id: z.number(),
  solution_name: z.string(),
  anydesk: z.string(),
  geo_point: z.array(z.number()),
  latitude: z.number(),
  longitude: z.number(),
  project: sharedProjectSchema,
  desktop_screen: z.string(),
  last_connected: z.string(),
  is_online: z.boolean(),
  camera_online_count: z.number(),
  camera_offline_count: z.number(),
  noti_count: z.number(),
})

const roadSchema = z.object({
  road_id: z.number(),
  road_name: z.string(),
  road_code: z.string(),
  solution: z.array(solutionSchema),
})

const subDepartmentSchema = z.object({
  department_id: z.number(),
  department_short_name: z.string(),
  camera_online_count: z.number(),
  camera_offline_count: z.number(),
  noti_count: z.number(),
  roads: z.array(roadSchema),
})

const vmsDepartmentListSchema = z.object({
  department_id: z.number(),
  department_short_name: z.string(),
  camera_online_count: z.number(),
  camera_offline_count: z.number(),
  noti_count: z.number(),
  sub_department: z.array(subDepartmentSchema),
})

export const apiResponseVMSDepartmentSchema = z.array(
  vmsDepartmentListSchema,
) satisfies z.ZodType<APIResponseVMSDepartment>

// ── Media schedule row (v2 API — a setting owns N of these) ──────────────────
// Same shape as `MediaScheduleByID` (display-api.ts) — reused for both schemas below.
const mediaScheduleSchema = z.object({
  days_of_week: z.array(z.number()),
  id: z.number(),
  media_url: z.string(),
  message: z.string(),
  schedule_name: z.string(),
  time_since: z.string(),
  time_to: z.string(),
})

// ── Media list ───────────────────────────────────────────────────────────────
export const vmsMediaListSchema = z.object({
  created_at: z.string(),
  crossing_master_index: z.string(),
  date_since: z.string(),
  date_to: z.string(),
  id: z.number(),
  is_all_day: z.boolean(),
  schedules: z.array(mediaScheduleSchema),
  setting_type: vmsSettingTypeSchema,
  setting_type_id: z.number(),
  status: z.number(),
  status_updated_at: z.string(),
  type_name: z.string(),
}) satisfies z.ZodType<VMSMediaList>

export const apiResponseVMSMediaSchema = z.object({
  meta_data: metaDataSchema,
  res_data: z.array(vmsMediaListSchema),
}) satisfies z.ZodType<APIResponseVMSMedia>

// ── Upcoming summary ─────────────────────────────────────────────────────────
export const apiResponseVMSUpcomingSummarySchema = z.object({
  count: z.object({
    disconnected_count: z.number(),
    most_bureau: z.string(),
    most_bureau_percent: z.number(),
    playing_count: z.number(),
    settings_count: z.number(),
  }),
  upcoming: z.object({
    setting_type_id: z.number(),
    setting_type_name: z.string(),
    solution_name: z.string(),
  }),
}) satisfies z.ZodType<APIResponseVMSUpcomingSummary>

// ── Setting by road ──────────────────────────────────────────────────────────
const settingByRoadItemSchema = z.object({
  display_hour: z.string(),
  end_date: z.string(),
  is_online: z.boolean(),
  setting_type_name: z.string(),
  settings_content: z.string(),
  solution_name: z.string(),
  start_date: z.string(),
  status: z.number(),
  status_name: z.string(),
})

const vmsSettingByRoadSchema = z.object({
  department_short_name: z.string(),
  road_code: z.string(),
  region_name: z.string(),
  settings: z.array(settingByRoadItemSchema),
})

export const apiResponseVMSSettingByRoadSchema = z.array(
  vmsSettingByRoadSchema,
) satisfies z.ZodType<APIResponseVMSSettingByRoad>

// ── Setting schedule by date (what GET /vms/settings/schedule actually returns) ──
const vmsScheduleByDateSchema = z.object({
  setting_id: z.number(),
  date: z.string(),
  time_since: z.string(),
  time_to: z.string(),
  solution_name: z.string(),
  road_code: z.string(),
  anydesk: z.string(),
  date_count: z.string(),
  status: z.number(),
  status_name: z.string(),
  is_online: z.boolean(),
}) satisfies z.ZodType<VMSScheduleByDate>

export const apiResponseVMSScheduleByDateSchema = z.record(
  z.string(),
  z.array(vmsScheduleByDateSchema),
) satisfies z.ZodType<APIResponseVMSScheduleByDate>

// ── Media by ID ──────────────────────────────────────────────────────────────
// `id` here is `setting_id` from a schedule row — backend aliases it for GET/PUT/DELETE /vms/settings/media/{id}
export const apiResponseVMSMediaByIdSchema = z.object({
  created_at: z.string(),
  crossing_master_index: z.string(),
  date_count: z.string(),
  date_since: z.string(),
  date_to: z.string(),
  department_id: z.number(),
  department_short_name: z.string(),
  id: z.number(),
  is_all_day: z.boolean(),
  schedules: z.array(mediaScheduleSchema),
  setting_type_id: z.number(),
  setting_type_name: z.string(),
  solution_name: z.string(),
  status: z.number(),
  status_name: z.string(),
  status_updated_at: z.string(),
  stch: z.number(),
  type_name: z.string(),
}) satisfies z.ZodType<APIResponseVMSMediaById>

// ── Setting by status ────────────────────────────────────────────────────────
const cameraByStatusSchema = z.object({
  camera_id: z.string(),
  camera_name: z.string(),
  hls_url: z.string(),
})

const scheduleByStatusSchema = z.object({
  days_of_week: z.array(z.number()),
  schedule_id: z.number(),
  schedule_name: z.string(),
  time_since: z.string(),
  time_to: z.string(),
})

const vmsSettingByStatusSchema = z.object({
  vms_id: z.number(),
  setting_id: z.number(),
  type_name: z.string(),
  status: z.number(),
  status_name: z.string(),
  is_all_day: z.boolean(),
  is_online: z.boolean(),
  start_date: z.string(),
  end_date: z.string(),
  road_code: z.string(),
  solution_name: z.string(),
  screen_capture_url: z.string(),
  cameras: z.array(cameraByStatusSchema),
  schedules: z.array(scheduleByStatusSchema),
})

export const apiResponseVMSSettingByStatusSchema = z.array(
  vmsSettingByStatusSchema,
) satisfies z.ZodType<APIResponseVMSSettingByStatus>

// ── Setting status count ─────────────────────────────────────────────────────
const vmsSettingStatusCountSchema = z.object({
  count: z.number(),
  status_id: z.number(),
  status_name: z.string(),
})

export const apiResponseVMSSettingStatusCountSchema = z.array(
  vmsSettingStatusCountSchema,
) satisfies z.ZodType<APIResponseVMSSettingStatusCount>

// ── Batch delete ─────────────────────────────────────────────────────────────
// APIResponsePostVMSBatchDelete is a plain alias of the shared APIResponsePost shape.
export const apiResponsePostVMSBatchDeleteSchema = apiResponsePostSchema satisfies z.ZodType<APIResponsePostVMSBatchDelete>

// ── By VMS ID ────────────────────────────────────────────────────────────────
const scheduleByVMSIDSchema = z.object({
  schedule_name: z.string(),
  time_since: z.string(),
  time_to: z.string(),
}) satisfies z.ZodType<ScheduleByVMSID>

const vmsSettingByVMSIDSchema = z.object({
  schedule: z.array(scheduleByVMSIDSchema),
  solution_name: z.string(),
  status: z.number(),
  status_name: z.string(),
})

export const apiResponseVMSSettingByVMSIDSchema = z.array(
  vmsSettingByVMSIDSchema,
) satisfies z.ZodType<APIResponseVMSSettingByVMSID>

// ── Setting list ─────────────────────────────────────────────────────────────
const vmsSettingListSchema = z.object({
  anydesk: z.string(),
  camera_offline_count: z.number(),
  camera_online_count: z.number(),
  desktop_screen: z.string(),
  geo_point: z.array(z.number()),
  is_online: z.boolean(),
  last_connected: z.string(),
  project: sharedProjectSchema,
  solution_id: z.number(),
  solution_name: z.string(),
  vms_id: z.number(),
}) satisfies z.ZodType<VMSSettingList>

export const apiResponseVMSSettingListSchema = z.object({
  meta_data: metaDataSchema,
  res_data: z.array(vmsSettingListSchema),
}) satisfies z.ZodType<APIResponseVMSSettingList>

// ── Setting-type writes ──────────────────────────────────────────────────────
// All three alias the shared APIResponsePost shape, same as batch delete above.
export const apiResponsePostVMSSettingTypeSchema = apiResponsePostSchema satisfies z.ZodType<APIResponsePostVMSSettingType>
export const apiResponsePutVMSSettingTypeSchema = apiResponsePostSchema satisfies z.ZodType<APIResponsePutVMSSettingType>
export const apiResponseDeleteVMSSettingTypeSchema = apiResponsePostSchema satisfies z.ZodType<APIResponseDeleteVMSSettingType>
