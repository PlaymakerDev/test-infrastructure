// GET /manage/notifications/summary?start_date=&end_date= — verified live 2026-07-09.
// Aggregates notification logs across [start_date, end_date] into one row per
// source_type. Bare array (NO `{ res_data }` envelope) — source_types with
// zero notifications in range are simply omitted from the array.

export type NotificationSourceType = 'lighting' | 'analytic' | 'vms_setting'

export interface NotificationTypeInfo {
  /** null for source_type=lighting — name is the fixed literal "line_check". */
  id: number | null
  name: string
}

export interface NotificationDepartmentInfo {
  department_id: number
  department_short_name: string
  count: number
}

export interface NotificationSummaryItem {
  source_type: NotificationSourceType
  /** Total notifications fired for this source_type in range. */
  count: number
  /** Most-frequent ref_type in range. */
  most_type: NotificationTypeInfo | null
  /** Count matching most_type — for source_type=lighting this equals `count`. */
  most_count: number
  /** Department that fired the most notifications for this source_type in range. */
  most_department: NotificationDepartmentInfo | null
}

/** Endpoint returns a bare array. */
export type APIResponseNotificationSummary = NotificationSummaryItem[]

// ── Notification feed (camera outages + maintenance cases) ──────────────────
// Contract per src/features/admin/maintenance/FRONTEND_NOTIFICATION_FEED.md,
// re-verified against production 2026-09-21. Replaces the camera-outage-only
// feed. Read state is per-user and independent of open/recovered (is_open ≠
// is_read); there is no "mark as unread".
//
// ⚠ Field presence is NOT uniform (§9.5): `solution` / `road` / `department`
// are always present but nullable, while `camera` / `case` / `recovered_at`
// have NO KEY AT ALL when they don't apply. That's why this is a discriminated
// union on `kind` rather than one wide interface with optional members.

export type NotificationFeedKind = 'camera_outage' | 'case'

export interface NotificationFeedPlace {
  /** Always present, may be null. */
  solution: { id: number; name: string } | null
  road: { id: number; code: string; name: string } | null
  department: { id: number; short_name: string } | null
}

interface NotificationFeedBase extends NotificationFeedPlace {
  /** ⚠ String for BOTH kinds — outage ids look numeric, case ids are uuids.
   *  Never coerce to number; send it back to /read exactly as received. */
  id: string
  /** Sort key (DESC, then id DESC). Outage = went down, case = was opened. */
  occurred_at: string
  is_open: boolean
  is_read: boolean
}

export interface CameraOutageFeedItem extends NotificationFeedBase {
  kind: 'camera_outage'
  camera: { id: string; name: string; ip_address: string; sta: string }
  /** When the stream actually went down (mirrors occurred_at). */
  started_at: string
  /** When the worker confirmed it (~15 min later) — debug only. */
  detected_at: string
  /** KEY IS ABSENT while the camera is still down — not null. */
  recovered_at?: string
  /** Grows every poll while is_open — do not cache long. */
  duration_minutes: number
}

export interface CaseFeedItem extends NotificationFeedBase {
  kind: 'case'
  case: {
    case_no: string
    status: 'open' | 'in_progress' | 'pending_approval' | 'closed'
    /** Can be "" (empty string, not null) — test with truthiness (§9.6). */
    category: string
    problem: string
    due_date: string | null
    /** 0 = the case covers an install point / project, not specific cameras. */
    camera_count: number
  }
}

export type NotificationFeedItem = CameraOutageFeedItem | CaseFeedItem

export interface NotificationFeedMeta {
  /** Total matching rows — THE badge number (never res_data.length). */
  count: number
  page: number
  limit: number
  total_pages: number
}

/** GET success carries no res_code — success is the HTTP status alone. */
export interface APIResponseNotificationFeed {
  res_data: NotificationFeedItem[]
  meta_data: NotificationFeedMeta
}

export interface NotificationFeedParams {
  kind?: NotificationFeedKind | 'all'
  status?: 'open' | 'recovered' | 'all'
  /** ⚠ Backend default is 24, which hides nearly everything (6 of 1,598 cases
   *  measured on prod). Always pass this explicitly. Max 8760. */
  since_hours?: number
  unread_only?: boolean
  /** Narrows within the JWT scope only — out-of-scope ids yield [], not 403. */
  department_id?: number
  /** 'all' + a bureau department_id → every แขวง under that bureau. */
  scope?: 'all'
  /** Camera name/IP for outages · case_no/problem for cases. */
  search?: string
  page?: number
  /** 1–100. Over 100 is rejected with 40010, not silently clamped. */
  limit?: number
}

/** One row to mark read — the pair is the identity, since the two kinds have
 *  independent id spaces. */
export interface NotificationFeedReadRef {
  kind: NotificationFeedKind
  id: string
}

/** Body of POST /notifications/feed/read — exactly one of the two shapes.
 *  `items` takes ≤500; `all` can be narrowed to one kind. */
export type APIRequestMarkFeedRead =
  | { items: NotificationFeedReadRef[] }
  | { all: true; kind?: NotificationFeedKind | 'all' }

export interface APIResponseMarkFeedRead {
  res_code: number
  /** Rows flipped unread→read. Re-marking, unknown ids and out-of-scope ids
   *  all give 0 without an error — never treat 0 as a failure (§4). */
  res_data: { marked: number }
}
