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
