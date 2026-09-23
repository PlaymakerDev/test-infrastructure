import { z } from 'zod'
import type {
  APIResponseMarkFeedRead,
  APIResponseNotificationFeed,
  CameraOutageFeedItem,
  CaseFeedItem,
  NotificationFeedMeta,
} from '@/types/manage/notification-api'

// Notification feed — shapes per
// src/features/admin/maintenance/FRONTEND_NOTIFICATION_FEED.md (§1).
// Compile-time-checked against the TS types via `satisfies`, exercised by
// fixtures in manage-notifications.test.ts (same convention as
// crosswalk/control-vms — not wired into the runtime queryFn).

/** Present on every item, but each one may be null (§9.5). */
const feedPlaceSchema = {
  solution: z.object({ id: z.number(), name: z.string() }).nullable(),
  road: z.object({ id: z.number(), code: z.string(), name: z.string() }).nullable(),
  department: z.object({ id: z.number(), short_name: z.string() }).nullable(),
}

const feedBaseSchema = {
  // String for both kinds — a number here would silently mangle case uuids.
  id: z.string(),
  occurred_at: z.string(),
  is_open: z.boolean(),
  is_read: z.boolean(),
  ...feedPlaceSchema,
}

export const cameraOutageFeedItemSchema = z.object({
  ...feedBaseSchema,
  kind: z.literal('camera_outage'),
  camera: z.object({
    id: z.string(),
    name: z.string(),
    ip_address: z.string(),
    sta: z.string(),
  }),
  started_at: z.string(),
  detected_at: z.string(),
  // .optional() not .nullable(): the key is absent while the camera is down.
  recovered_at: z.string().optional(),
  duration_minutes: z.number(),
}) satisfies z.ZodType<CameraOutageFeedItem>

export const caseFeedItemSchema = z.object({
  ...feedBaseSchema,
  kind: z.literal('case'),
  case: z.object({
    case_no: z.string(),
    status: z.enum(['open', 'in_progress', 'pending_approval', 'closed']),
    // "" is a real value here, never null.
    category: z.string(),
    problem: z.string(),
    due_date: z.string().nullable(),
    camera_count: z.number(),
  }),
}) satisfies z.ZodType<CaseFeedItem>

/** Discriminated on `kind` — the two shapes share only the base fields. */
export const notificationFeedItemSchema = z.discriminatedUnion('kind', [
  cameraOutageFeedItemSchema,
  caseFeedItemSchema,
])

const notificationFeedMetaSchema = z.object({
  count: z.number(),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
}) satisfies z.ZodType<NotificationFeedMeta>

/** GET /manage/notifications/feed — success has NO res_code (§1). */
export const apiResponseNotificationFeedSchema = z.object({
  res_data: z.array(notificationFeedItemSchema),
  meta_data: notificationFeedMetaSchema,
}) satisfies z.ZodType<APIResponseNotificationFeed>

/** POST /manage/notifications/feed/read — success DOES carry res_code (§4). */
export const apiResponseMarkFeedReadSchema = z.object({
  res_code: z.number(),
  res_data: z.object({ marked: z.number() }),
}) satisfies z.ZodType<APIResponseMarkFeedRead>
