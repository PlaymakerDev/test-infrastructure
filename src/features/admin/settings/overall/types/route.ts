// UI shape for the Settings → Route tab. IDs are numeric (matches the
// /api-v2/manage/roads primary key). `responsibleOffice` is a display-only
// label joined client-side from /manage/departments; the mutation payload
// carries `departmentId` (the numeric FK) instead.

export interface Route {
  id: number
  code: string
  name: string
  province: string
  district: string
  subdistrict: string
  startSta: string
  endSta: string
  lengthKm: number
  departmentId: number | null
  /** Display-only — resolved from department_id → department_short_name. */
  responsibleOffice: string
  createdAt: string
}

export interface RouteFormValues {
  code: string
  name: string
  province: string
  district: string
  subdistrict: string
  startSta: string
  endSta: string
  lengthKm: number | null
  departmentId: number
}

export interface RouteFilters {
  province: string | null
  /** Numeric FK — matches `road.department_id`. */
  departmentId: number | null
  search: string
}
