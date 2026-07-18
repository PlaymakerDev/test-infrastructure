// Settings → Project management (/api-v2/manage/project) API types.
// Verified live 2026-07-06 against the live backend. GET list responses are
// wrapped in `{ res_data: T[], meta_data: {...} }`; single-item / mutation
// responses are the bare object. Budget-year list is a plain `number[]`.

// Re-export the shared list-query params and meta_data envelope so callers
// can import the whole surface from a single per-entity module.
export type { ListParams, APIResponseMetaData } from './params'
import type { APIResponseMetaData } from './params'

// ── Shared shapes ────────────────────────────────────────────────────────────

/** Inline user block returned nested under a project's `contractor` field.
 *  Mirrors the /contractor listing item — kept local to avoid a circular
 *  import with contractor-api.ts. */
export interface ProjectContractorUser {
  id: string
  username: string
  user_type_id: number
  is_active: boolean
  contractor: {
    user_id: string
    company_name: string
    short_name: string
    address: string | null
    name: string | null
    phone: string | null
    role: string | null
  }
}

/** One road linked to a project. Server accepts an array of these on
 *  POST/PUT. Rejects empty arrays with res_code 40010 (details="min").
 *
 *  On PUT: rows with `project_road_id === 0` (or missing) are treated as
 *  NEW rows and cause the backend to insert a duplicate project_road plus
 *  auto-create a "จุดติดตั้งที่ 1" solution_location. To update-in-place
 *  the frontend MUST forward the existing `project_road_id` returned from
 *  GET /project/{id}.project_roads[i].project_road_id. */
export interface ProjectRoadLink {
  road_id: number
  project_road_id?: number
}

// ── GET /manage/project ──────────────────────────────────────────────────────

export interface APIResponseProject {
  id: number
  project_name: string
  contract_no: string
  project_no: string
  contractor_id: string
  department_id: number
  /** ISO datetime string from the server. */
  warranty_start_date: string
  /** ISO datetime string from the server. */
  warranty_end_date: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  budget_year: number
  is_warranty: boolean
  /** Present on list rows so the UI can render "ผู้รับจ้าง" without a
   *  second fetch — read `contractor.contractor.company_name`. */
  contractor?: ProjectContractorUser | null
}

export interface APIResponseProjectListEnvelope {
  res_data: APIResponseProject[]
  meta_data: APIResponseMetaData
}

// ── GET /manage/project/budget_year ──────────────────────────────────────────
// Plain array (NOT enveloped) — e.g. `[2564, 2565, 2566]`.
export type APIResponseBudgetYearList = number[]

// ── POST/PUT /manage/project body ────────────────────────────────────────────
// Required: budget_year, contract_no, project_no, project_name, department_id,
// contractor_id, warranty_start_date, warranty_end_date, project_road.
// Dates are sent as "YYYY-MM-DD" (NOT full ISO).
// PUT reuses the same body but includes `id` — see APIRequestProjectUpdate.

export interface APIRequestProject {
  budget_year: number
  contract_no: string
  project_no: string
  project_name: string
  department_id: number
  contractor_id: string
  /** "YYYY-MM-DD". */
  warranty_start_date: string
  /** "YYYY-MM-DD". */
  warranty_end_date: string
  /** Must contain at least one road; server rejects an empty array. */
  project_road: ProjectRoadLink[]
}

/** PUT /manage/project — same body as create, but the numeric project id
 *  is carried in the payload (NOT the path). */
export type APIRequestProjectUpdate = APIRequestProject & { id: number }
