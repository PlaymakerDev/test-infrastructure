// Settings → Departments + Regions dropdown types (/api-v2/manage/departments,
// /api-v2/manage/regions). Verified live 2026-07-06.
// Both endpoints return PLAIN arrays (NO `{ res_data }` envelope).

// ── GET /manage/departments ──────────────────────────────────────────────────

export interface APIResponseDepartment {
  id: number
  department_group: string | null
  province: string | null
  department_office_no: string | null
  department_name: string
  /** Short label used across the UI for "ผู้ว่าจ้าง" — e.g. "ขทช.สมุทรปราการ". */
  department_short_name: string
  is_external: boolean
  province_id: number | null
  is_urban: boolean
  department_type: string | null
  region_id: number | null
}

/** Endpoint returns a bare array. */
export type APIResponseDepartmentList = APIResponseDepartment[]

// ── GET /manage/regions ──────────────────────────────────────────────────────

export interface APIResponseRegion {
  id: number
  name_th: string
  name_en: string
}

/** Endpoint returns a bare array. */
export type APIResponseRegionList = APIResponseRegion[]
