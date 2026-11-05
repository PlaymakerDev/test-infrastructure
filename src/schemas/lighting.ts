import { z } from 'zod'
import type {
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
