// Settings → General User management (/api-v2/manage/general_user) API types.
// Verified live 2026-07-06. GET list is enveloped as
// `{ res_data: T[], meta_data: {...} }`.
// IMPORTANT wire quirks:
//  • The primary key field is `user_id` (uuid), NOT `id`.
//  • The last-name field on GET is `lastname` (NOT `last_name`) — the OpenAPI
//    schema says otherwise, but the live server returns `lastname`. Trust
//    the server here.
//  • The mock UI's `email` column is dropped — real API has no email.
//  • The mock UI's `status` column is inferred from `user.is_active`.
//  • `?search=…` currently returns malformed JSON (backend bug). The frontend
//    hook filters this ONE list client-side over the small (~6 row) dataset.
// On write (POST/PUT), the server DOES accept `last_name` (underscored).

export type { ListParams, APIResponseMetaData } from './params'
import type { APIResponseMetaData } from './params'

// ── Nested user + province blocks returned on list rows ──────────────────────

export interface GeneralUserAccount {
  id: string
  username: string
  user_type_id: number
  is_active: boolean
}

export interface GeneralUserProvince {
  id: number
  name_th: string
  name_en: string
  region_id: number
  region_name_th: string
}

// ── GET /manage/general_user ─────────────────────────────────────────────────

export interface APIResponseGeneralUser {
  /** Primary key. UUID. */
  user_id: string
  first_name: string
  /** WIRE FIELD IS `lastname`. Schema says `last_name`; ignore the schema. */
  lastname: string
  province_id: number | null
  department_id: number | null
  /** Free-form role string (e.g. Thai job title). */
  role: string | null
  is_ldap: boolean
  created_at: string
  created_by: string | null
  user?: GeneralUserAccount | null
  province?: GeneralUserProvince | null
}

export interface APIResponseGeneralUserListEnvelope {
  res_data: APIResponseGeneralUser[]
  meta_data: APIResponseMetaData
}

// ── POST /manage/general_user ────────────────────────────────────────────────
// Required: username, first_name, last_name, department_id, role.
export interface APIRequestRegisterGeneralUser {
  username: string
  first_name: string
  /** Underscored on WRITE — the server accepts this field name. */
  last_name: string
  department_id: number
  role: string
  password?: string
  is_ldap?: boolean
  /** Optional province code (matches Province.id). */
  province_code?: number
}

// ── PUT /manage/general_user/{user_id} ───────────────────────────────────────
// Required: first_name, last_name, department_id, role. Path id = user_id (uuid).
export interface APIRequestUpdateGeneralUser {
  first_name: string
  last_name: string
  department_id: number
  role: string
  province_code?: number
}

// ── PATCH /manage/general_user/{user_id}/password ────────────────────────────
export interface APIRequestUpdateGeneralUserPassword {
  password: string
}
