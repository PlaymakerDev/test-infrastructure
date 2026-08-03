import { z } from 'zod'
import type {
  APIResponseCameraOutageList,
  APIResponseMarkCameraOutageRead,
  CameraOutageItem,
  CameraOutageMeta,
} from '@/types/manage/notification-api'

// Camera-outage notification feed — shapes per
// docs/notifications/FRONTEND_NOTIFICATIONS.md (§2–§4). Compile-time-checked
// against the TS types via `satisfies`, exercised by fixtures in
// manage-notifications.test.ts (same convention as crosswalk/control-vms —
// not wired into the runtime queryFn).

const cameraOutageCameraSchema = z.object({
  id: z.string(),
  name: z.string(),
  ip_address: z.string(),
  sta: z.string(),
})

export const cameraOutageItemSchema = z.object({
  id: z.number(),
  camera: cameraOutageCameraSchema,
  // solution / road / department are all nullable (§4)
  solution: z.object({ id: z.number(), name: z.string() }).nullable(),
  road: z.object({ id: z.number(), code: z.string(), name: z.string() }).nullable(),
  department: z.object({ id: z.number(), short_name: z.string() }).nullable(),
  started_at: z.string(),
  detected_at: z.string(),
  recovered_at: z.string().nullable(),
  is_open: z.boolean(),
  is_read: z.boolean(),
  duration_minutes: z.number(),
}) satisfies z.ZodType<CameraOutageItem>

const cameraOutageMetaSchema = z.object({
  count: z.number(),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
}) satisfies z.ZodType<CameraOutageMeta>

/** GET /manage/notifications/camera-outage — success has NO res_code (§4). */
export const apiResponseCameraOutageListSchema = z.object({
  res_data: z.array(cameraOutageItemSchema),
  meta_data: cameraOutageMetaSchema,
}) satisfies z.ZodType<APIResponseCameraOutageList>

/** POST /manage/notifications/camera-outage/read — success DOES carry res_code. */
export const apiResponseMarkCameraOutageReadSchema = z.object({
  res_code: z.number(),
  res_data: z.object({ marked: z.number() }),
}) satisfies z.ZodType<APIResponseMarkCameraOutageRead>
