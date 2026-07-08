// Settings → Road management (/api-v2/manage/roads) API types.
// Verified live 2026-07-06. GET list is enveloped as
// `{ res_data: T[], meta_data: {...} }`. The "responsibleOffice" column on
// the mock UI comes from `department_id` — join client-side against
// /manage/departments to render the label.

export type { ListParams, APIResponseMetaData } from './params'
import type { APIResponseMetaData } from './params'

// ── GET /manage/roads ────────────────────────────────────────────────────────

export interface APIResponseRoad {
  /** Numeric primary key. */
  id: number
  road_code: string
  road_name: string
  subdistrict: string
  district: string
  province: string
  department_id: number | null
  /** Kilometer-post strings, e.g. "0+000". */
  start_sta: string
  end_sta: string
  /** Kilometres — numeric. */
  distance: number | null
  created_at: string
  created_by: string | null
}

export interface APIResponseRoadListEnvelope {
  res_data: APIResponseRoad[]
  meta_data: APIResponseMetaData
}

// ── POST / PUT /manage/roads ─────────────────────────────────────────────────
// Required: road_code, road_name, province, district, subdistrict, start_sta,
// end_sta, department_id. `distance` is optional (backend can recompute).
export interface APIRequestRoad {
  road_code: string
  road_name: string
  province: string
  district: string
  subdistrict: string
  start_sta: string
  end_sta: string
  department_id: number
  distance?: number
}
