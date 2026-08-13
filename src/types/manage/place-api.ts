// Settings → Thai administrative places (/api-v2/manage/th_places/*).
// Verified live 2026-08-13. Endpoints return PLAIN arrays (NO `{ res_data }`
// envelope) — same convention as /manage/departments and /manage/regions.

// ── GET /manage/th_places/provinces ──────────────────────────────────────────
// The full 77-province master list. Backs the Settings → Route tab's จังหวัด
// dropdown (previously derived from the current roads page only, so it never
// showed more than the provinces that happened to be on-screen).

export interface APIResponseProvince {
  id: number
  name_th: string
  name_en: string
}

/** Endpoint returns a bare array. */
export type APIResponseProvinceList = APIResponseProvince[]
