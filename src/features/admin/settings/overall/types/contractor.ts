// UI-shape types for the ผู้รับจ้าง tab. Mirrors what the real backend at
// /api-v2/manage/contractor actually returns (verified live 2026-07-06):
//   - primary key is `user_id` (uuid) — mapped to `id`
//   - the API has NO taxId, NO email, NO province → those columns/filters
//     were dropped from the mock UI when wiring to the real endpoint.
//   - `projectCount` is derived on the client by counting projects whose
//     `contractor_id` matches this row's `id` (see ContactSection).

export interface Contractor {
  /** UUID — comes from the API's `user_id`. */
  id: string
  companyName: string
  shortName: string
  /** Contact person name — API `name`; empty string when null. */
  contactPerson: string
  phone: string
  address: string
  /** Free-form role/title string. */
  role: string
  /** ISO datetime from the server's `created_at`. */
  registeredAt: string
  /** Auth-side login. Read-only in the UI (shown for context on edit). */
  username: string
  isActive: boolean
  /** Client-computed by counting projects that reference this contractor. */
  projectCount: number
}

export interface ContractorFormValues {
  companyName: string
  shortName: string
  contactPerson?: string
  phone?: string
  address?: string
  role?: string
  /** Required only when creating a new contractor. Optional on edit — if
   *  omitted the server keeps the existing password. */
  password?: string
}

export interface ContractorFilters {
  search: string
}
