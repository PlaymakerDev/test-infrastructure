import { z } from 'zod'
import type {
  APIResponseVMSDepartment,
  APIResponseVMSMedia,
  APIResponseVMSSettingType,
  VMSMediaList,
  VMSSettingType,
} from '@/types/control-vms/vms-api'
import type {
  APIResponseVMSMediaById,
  APIResponseVMSSettingByRoad,
  APIResponseVMSSettingSchedule,
  APIResponseVMSUpcomingSummary,
} from '@/types/control-vms/display-api'
import { metaDataSchema } from './shared'

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
  project: sharedProjectSchema,
  desktop_screen: z.string(),
  last_connected: z.string(),
  is_online: z.boolean(),
  camera_online_count: z.number(),
  camera_offline_count: z.number(),
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
  roads: z.array(roadSchema),
})

const vmsDepartmentListSchema = z.object({
  department_id: z.number(),
  department_short_name: z.string(),
  camera_online_count: z.number(),
  camera_offline_count: z.number(),
  sub_department: z.array(subDepartmentSchema),
})

export const apiResponseVMSDepartmentSchema = z.array(
  vmsDepartmentListSchema,
) satisfies z.ZodType<APIResponseVMSDepartment>

// ── Media list ───────────────────────────────────────────────────────────────
export const vmsMediaListSchema = z.object({
  created_at: z.string(),
  created_by: z.string(),
  crossing_master_index: z.string(),
  id: z.number(),
  media_url: z.string(),
  message: z.string(),
  setting_type: vmsSettingTypeSchema,
  setting_type_id: z.number(),
  since: z.string(),
  to: z.string(),
  type_name: z.string(),
}) satisfies z.ZodType<VMSMediaList>

export const apiResponseVMSMediaSchema = z.object({
  meta_data: metaDataSchema,
  res_data: z.array(vmsMediaListSchema),
}) satisfies z.ZodType<APIResponseVMSMedia>

// ── Upcoming summary ─────────────────────────────────────────────────────────
export const apiResponseVMSUpcomingSummarySchema = z.object({
  count: z.object({
    most_bureau: z.string(),
    most_bureau_percent: z.number(),
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
  is_online: z.boolean(),
  setting_type_name: z.string(),
  settings_content: z.string(),
  since: z.string(),
  solution_name: z.string(),
  to: z.string(),
})

const vmsSettingByRoadSchema = z.object({
  department_short_name: z.string(),
  road_code: z.string(),
  settings: z.array(settingByRoadItemSchema),
})

export const apiResponseVMSSettingByRoadSchema = z.array(
  vmsSettingByRoadSchema,
) satisfies z.ZodType<APIResponseVMSSettingByRoad>

// ── Setting schedule ─────────────────────────────────────────────────────────
const vmsSettingScheduleSchema = z.object({
  setting_id: z.number(),
  solution_name: z.string(),
  road_code: z.string(),
  anydesk: z.string(),
  since: z.string(),
  to: z.string(),
  is_online: z.boolean(),
  date_count: z.string(),
})

export const apiResponseVMSSettingScheduleSchema = z.array(
  vmsSettingScheduleSchema,
) satisfies z.ZodType<APIResponseVMSSettingSchedule>

// ── Media by ID ──────────────────────────────────────────────────────────────
// `id` here is `setting_id` from a schedule row — backend aliases it for GET/PUT/DELETE /vms/settings/media/{id}
export const apiResponseVMSMediaByIdSchema = z.object({
  id: z.number(),
  crossing_master_index: z.string(),
  type_name: z.string(),
  media_url: z.string(),
  since: z.string(),
  to: z.string(),
  message: z.string(),
  setting_type_id: z.number(),
  setting_type_name: z.string(),
  solution_name: z.string(),
  department_id: z.number(),
  department_short_name: z.string(),
  stch: z.number(),
  date_count: z.string(),
  created_at: z.string(),
}) satisfies z.ZodType<APIResponseVMSMediaById>
