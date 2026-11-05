import { z } from 'zod'
import type {
  LightingLamp,
  LightingLampCurrentHour,
  LightingLampCurrentHourly,
  LightingLampDay,
  LightingLampList,
  LightingLampSummary,
  LightingLampWeekly,
  LightingSolutionDetail,
  LightingSolutionDevice,
  LightingSolutionIot,
  LightingSolutionLora,
} from '@/types/lighting'

// Compile-time-checked fixtures (via `satisfies z.ZodType<...>`), mirroring the
// crosswalk/tracking/lpr schemas. Not wired into the runtime queryFn.

// ── GET /lighting/solutions/{solution_id} ────────────────────────────────────
export const lightingSolutionDeviceSchema = z.object({
  id: z.number(),
  device_id: z.string(),
  pole_number: z.number().nullable(),
  device_type: z.string(),
  device_desc: z.string(),
  last_connectd: z.string(),
  last_update: z.string(),
}) satisfies z.ZodType<LightingSolutionDevice>

export const lightingSolutionLoraSchema = z.object({
  online_count: z.number(),
  offline_count: z.number(),
  is_online: z.boolean(),
}) satisfies z.ZodType<LightingSolutionLora>

export const lightingSolutionIotSchema = z.object({
  id: z.number(),
  imei: z.string(),
  phase_type: z.string(),
  sem_type: z.string(),
  diagram_type: z.string(),
  connection_type: z.string(),
  send_frequency: z.string(),
  last_update: z.string(),
  is_online: z.boolean(),
  has_broken_wire: z.boolean(),
}) satisfies z.ZodType<LightingSolutionIot>

export const apiResponseLightingSolutionSchema = z.object({
  project: z.object({
    id: z.number(),
    project_name: z.string(),
    contract_no: z.string().nullable(),
    project_no: z.string().nullable(),
    budget_year: z.number(),
    warranty_start_date: z.string().nullable(),
    warranty_end_date: z.string().nullable(),
    is_warranty: z.boolean(),
    department_id: z.number(),
  }),
  road: z.object({ id: z.number(), road_code: z.string(), road_name: z.string() }),
  solution: z.object({
    id: z.number(),
    solution_name: z.string(),
    sta: z.string().nullable(),
    ip_address: z.string().nullable(),
    remarks: z.string(),
  }),
  lighting: z.object({
    id: z.number(),
    lighting_type: z.number(),
    proxy_url: z.string(),
    iot: lightingSolutionIotSchema.nullable(),
    lora: lightingSolutionLoraSchema.nullable(),
    devices: z.array(lightingSolutionDeviceSchema).nullable(),
  }),
}) satisfies z.ZodType<LightingSolutionDetail>

// ── GET /lighting/solutions/{solution_id}/lamps[/summary|/weekly] ────────────
export const lightingLampSchema = z.object({
  device_id: z.string(),
  dev_eui: z.string(),
  device_type: z.string(),
  pole: z.string(),
  lamp_type: z.string(),
  current: z.number().nullable(),
  status: z.string(),
  state: z.string().nullable(),
  is_online: z.boolean(),
  battery: z.number().nullable(),
  rssi: z.number().nullable(),
  sta: z.string(),
  highmast_group: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  last_update: z.string(),
}) satisfies z.ZodType<LightingLamp>

export const apiResponseLightingLampsSchema = z.object({
  solution_id: z.number(),
  wid: z.number(),
  total: z.number(),
  lamps: z.array(lightingLampSchema).nullable(),
}) satisfies z.ZodType<LightingLampList>

export const apiResponseLightingLampSummarySchema = z.object({
  solution_id: z.number(),
  wid: z.number(),
  detail: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  total: z.number(),
  work: z.number(),
  fail: z.number(),
}) satisfies z.ZodType<LightingLampSummary>

export const lightingLampDaySchema = z.object({
  date: z.string(),
  total: z.number(),
  work: z.number(),
  fail: z.number(),
}) satisfies z.ZodType<LightingLampDay>

export const apiResponseLightingLampsWeeklySchema = z.object({
  solution_id: z.number(),
  wid: z.number(),
  days: z.array(lightingLampDaySchema).nullable(),
}) satisfies z.ZodType<LightingLampWeekly>

export const lightingLampCurrentHourSchema = z.object({
  hour: z.string(),
  avg_amp: z.number().nullable(),
  min_amp: z.number().nullable(),
  max_amp: z.number().nullable(),
  lamps: z.number(),
  samples: z.number(),
}) satisfies z.ZodType<LightingLampCurrentHour>

export const apiResponseLightingLampCurrentHourlySchema = z.object({
  solution_id: z.number(),
  wid: z.number(),
  date: z.string(),
  device_id: z.string().nullable(),
  hours: z.array(lightingLampCurrentHourSchema).nullable(),
}) satisfies z.ZodType<LightingLampCurrentHourly>
