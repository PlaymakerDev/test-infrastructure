// Settings → Contractor management (/api-v2/manage/contractor) API types.
// Verified live 2026-07-06. GET list is enveloped as
// `{ res_data: T[], meta_data: {...} }`.
// IMPORTANT: the primary key field is `user_id` (uuid), NOT `id`.
// The API grew an `email` column (2026-07-18 migration
// `2026-07-18c_maintenance_case_project.sql`) so maintenance cases can email
// the responsible contractor when a device goes offline. `taxId` still has no
// server-side storage.

export type { ListParams, APIResponseMetaData } from './params'
import type { APIResponseMetaData } from './params'

/** Auth-side user attached to a contractor row. Present on list responses so
 *  the UI can render account status without a follow-up fetch. */
export interface ContractorUser {
  id: string
  username: string
  user_type_id: number
  is_active: boolean
}

// ── GET /manage/contractor ───────────────────────────────────────────────────

export interface APIResponseContractor {
  /** Primary key. UUID. */
  user_id: string
  company_name: string
  short_name: string
  address: string | null
  /** Contact person name (NOT the company name). */
  name: string | null
  phone: string | null
  /** Contact email — target for maintenance-case auto-notifications. */
  email?: string | null
  /** Free-form role/title string. */
  role?: string | null
  created_at: string
  created_by: string | null
  user?: ContractorUser | null
}

export interface APIResponseContractorListEnvelope {
  res_data: APIResponseContractor[]
  meta_data: APIResponseMetaData
}

// ── POST /manage/contractor ──────────────────────────────────────────────────
// Required: company_name, short_name, password.
export interface APIRequestRegisterContractor {
  company_name: string
  short_name: string
  password: string
  address?: string
  /** Contact person name. */
  name?: string
  phone?: string
  /** Contact email — target for maintenance-case notifications. */
  email?: string
  role?: string
}

// ── PUT /manage/contractor/{user_id} ─────────────────────────────────────────
// Required: company_name, short_name. Password is optional on update.
export interface APIRequestUpdateContractor {
  company_name: string
  short_name: string
  address?: string
  name?: string
  password?: string
  phone?: string
  email?: string
  role?: string
}
