// API types for the LPR (License Plate Recognition) feature.
// Backend: `https://its.drr.go.th/api-v2/lpr` — 4 read endpoints.
// See docs/lpr/API_DOCS.md for the full contract.

// ── GET /lpr/points ──────────────────────────────────────────────────────────
// One row per CCTV solution that has ≥1 LPR-capable camera — the "install
// point" shape the overall page renders as map markers + list cards. Same
// pattern as counting/incident where a solution is bound to a CCTV project.
export interface LPRInstallPoint {
  solution_id: number
  solution_name: string
  road_id?: number
  road_code?: string
  project_id?: number
  project_name?: string
  contract_no?: string
  department_id?: number
  lat: number
  lng: number
  camera_count: number
  camera_names: string[]
  events_today: number
  events_hour: number
  latest_captured_at: string
}
export type APIResponseLPRPoints = LPRInstallPoint[]

// ── GET /lpr/points/:solution_id/plates ─────────────────────────────────────
// Recent detections at any camera owned by the given CCTV solution. Same
// shape as LPRTimelineEvent but per-install-point instead of per-plate.
export interface LPRPointPlate {
  id: number
  source: LPRSource
  captured_at: string
  captured_at_display: string
  plate_number: string
  plate_province: string
  vehicle_type_name?: string
  vehicle_brand?: string
  vehicle_color?: string
  camera_name?: string
  detection_point?: string
  vehicle_image?: string
  plate_image?: string
  speed?: number | null
  is_overweight?: boolean | null
}

export interface APIRequestLPRPointPlates {
  cursor?: string
  limit?: number
}

export interface APIResponseLPRPointPlates {
  res_data: LPRPointPlate[]
  next_cursor?: string | null
  has_more: boolean
}

// ── GET /lpr/points/:solution_id/stats ──────────────────────────────────────
// Aggregate for the detail-overview: hourly today+yesterday, province Top-10,
// vehicle-type Top-10, plus totals.
export interface LPRHourBucket {
  hour: number
  count: number
}
export interface LPRProvinceBucket {
  province: string
  count: number
}
export interface LPRVehicleBucket {
  vehicle_type_name: string
  count: number
}
export interface APIResponseLPRPointStats {
  total: number
  total_yesterday: number
  avg_speed: number
  hourly_today: LPRHourBucket[]
  hourly_yesterday: LPRHourBucket[]
  province_top: LPRProvinceBucket[]
  vehicle_type_top: LPRVehicleBucket[]
}



export type LPRSource = 'wim' | 'anpr'
export type LPRSourceFilter = 'all' | LPRSource

// `detection_location = [latitude, longitude]`. Missing coords come back as
// `[null, null]`; when the whole field is absent the value is `null` (no array).
// Mapbox expects `[lng, lat]` — swap before centering.
export type LPRCoords = [number | null, number | null] | null

// ── GET /plates ─────────────────────────────────────────────────────────────
// List of latest plates (deduped per plate_number+plate_province, captured_at
// DESC), cursor-paginated.

export interface APIRequestLPRPlates {
  q?: string
  source?: LPRSourceFilter
  cursor?: string
  limit?: number
}

export interface LPRPlateListItem {
  plate_number: string
  plate_province: string
  vehicle_type_name: string | null
  // Preformatted type label for WIM records (e.g. "ประเภท 1") — already includes
  // the "ประเภท" prefix. Optional/absent for ANPR. May arrive as string or number.
  vehicle_type_number?: number | string | null
  // Latest record's source (backward compat).
  source: LPRSource
  // All sources this plate has ever been seen with, unique (v2 — e.g. a plate
  // seen by both stations is ["wim","anpr"]).
  sources?: LPRSource[]
  detection_point: string | null
  captured_at: string
  captured_at_display: string
}

// Cursor envelope shared by /plates and /timeline (NOT the res_code/meta_data
// envelope). `next_cursor` is present only when `has_more` is true.
export interface APIResponseLPRPlates {
  res_data: LPRPlateListItem[]
  next_cursor?: string | null
  has_more: boolean
}

// ── GET /plates/:province/:number ─────────────────────────────────────────────

export interface LPRDetectionRef {
  captured_at: string
  captured_at_display: string
  source: LPRSource
  detection_point: string | null
  camera_name: string | null
  // Present on `latest`, absent on `first_seen`.
  detection_location?: LPRCoords
}

export interface LPRMetadata {
  plate_type: string | null
  vehicle_type_number: number | string | null
  vehicle_type_name: string | null
  vehicle_brand: string | null
  vehicle_color: string | null
}

export interface LPRMapPin {
  detection_point: string | null
  source: LPRSource
  count: number
  latest_captured_at: string
  latest_captured_at_display: string
  detection_location: LPRCoords
}

export interface LPRFrequentArea {
  detection_point: string | null
  source: LPRSource
  count: number
  detection_location: LPRCoords
}

export interface APIResponseLPRPlateDetail {
  plate_number: string
  plate_province: string
  first_seen: LPRDetectionRef
  latest: LPRDetectionRef
  metadata: LPRMetadata
  map_pins: LPRMapPin[]
  frequent_areas: LPRFrequentArea[]
}

// ── GET /plates/:province/:number/timeline ────────────────────────────────────

export interface APIRequestLPRTimeline {
  cursor?: string
  limit?: number
}

export interface LPRTimelineEvent {
  id: number
  source: LPRSource
  captured_at: string
  captured_at_display: string
  detection_point: string | null
  camera_name: string | null
  detection_location: LPRCoords
  // Absolute URLs (backend prepends host per source) — do NOT prefix.
  vehicle_image: string | null
  plate_image: string | null
  speed: number | null
  lane: number | null
  // WIM only — null for ANPR.
  grossweight: number | null
  legalweight: number | null
  is_overweight: boolean | null
}

export interface APIResponseLPRTimeline {
  res_data: LPRTimelineEvent[]
  next_cursor?: string | null
  has_more: boolean
}
