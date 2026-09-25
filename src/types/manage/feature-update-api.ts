/** GET /manage/feature-updates/:feature — the active "feature update"
 *  notices for one feature key, newest first (BE 2026-09-24).
 *
 *  `feature` is a free-form key the backend stores as-is (case-sensitive);
 *  the frontend asks with each menu's URL segment (lpr, cctv, …). An unknown
 *  key, or one with nothing active, returns []. There is no "all features"
 *  endpoint. Open to the admin, contractor and user roles. */
export interface FeatureUpdate {
  id: number
  feature: string
  title: string
  /** Line breaks may arrive as a literal "\n" (backslash + n) as well as a
   *  real newline — the first row in production carries the literal form. */
  content: string
  /** Always true in practice — the endpoint returns active rows only. */
  is_active: boolean
  created_at: string
}

export type APIResponseFeatureUpdates = FeatureUpdate[]
