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

// ── Camera-outage notification feed ─────────────────────────────────────────
// Contract per docs/notifications/FRONTEND_NOTIFICATIONS.md (§2–§4).
// One item = one outage event of one camera. Read state is per-user and is
// independent from open/recovered state (is_open ≠ is_read).

export interface CameraOutageCamera {
  id: string
  name: string
  ip_address: string
  sta: string
}

export interface CameraOutageItem {
  /** Notification key — what POST /read takes in `ids`. */
  id: number
  camera: CameraOutageCamera
  /** Nullable: some cameras aren't tied to an install point / road / dept. */
  solution: { id: number; name: string } | null
  road: { id: number; code: string; name: string } | null
  department: { id: number; short_name: string } | null
  /** When the stream actually went down — the timestamp shown to users. */
  started_at: string
  /** When the worker confirmed it (≥15 min after started_at) — debug only. */
  detected_at: string
  /** null = still down. */
  recovered_at: string | null
  is_open: boolean
  is_read: boolean
  /** Grows every poll while is_open — do not cache long. */
  duration_minutes: number
}

export interface CameraOutageMeta {
  /** Total matching rows — THE badge number (never res_data.length). */
  count: number
  page: number
  limit: number
  total_pages: number
}

/** GET success carries no res_code — success is the HTTP status alone. */
export interface APIResponseCameraOutageList {
  res_data: CameraOutageItem[]
  meta_data: CameraOutageMeta
}

export interface CameraOutageListParams {
  status?: 'open' | 'recovered' | 'all'
  since_hours?: number
  unread_only?: boolean
  /** Narrows within the JWT scope only — out-of-scope ids yield [], not 403. */
  department_id?: number
  /** 'all' + a bureau department_id → every แขวง under that bureau. */
  scope?: 'all'
  search?: string
  page?: number
  limit?: number
}

/** Body of POST /notifications/camera-outage/read — exactly one of the two. */
export type APIRequestMarkCameraOutageRead = { ids: number[] } | { all: true }

export interface APIResponseMarkCameraOutageRead {
  res_code: number
  /** Rows flipped unread→read; re-sending the same ids gives 0, not an error. */
  res_data: { marked: number }
}
