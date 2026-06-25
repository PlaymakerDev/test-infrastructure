// Central palette + helpers for Incident Detection (Analytic) event types.
// Used by every component that renders an event color/label (donut, trend chart,
// event list dots, table tags) so a road's incidents look consistent everywhere.
//
// ── Source of truth ──────────────────────────────────────────────────────────
// The backend `/analytic` API identifies an event type by a numeric
// `analytic_type` id (1–9) plus `type_name_en` (e.g. "car_stop") and
// `type_name_th`. Verified live (GET /analytic/details/transactions → summary
// .type_details) on 2026-06-23:
//   1 car_accident · 2 car_breakdown · 3 car_stop · 4 road_construction
//   5 road_block · 6 wrong_way · 7 truck_right · 8 over_speed · 9 limit_speed
// The API currently returns 9 types. `SUSPICIOUS_PERSON` (id 10) is kept as a
// reserved entry per design — backend has not shipped it yet (no rows will ever
// carry id 10 until BE adds it), so it simply never appears in real data.
//
// Colors are the Figma palette. The lookup keys on EVERYTHING a caller might
// hold — analytic_type id, type_name_en, the FE enum name, AND the Thai
// label — so callers pass whatever they have without coordination. Prefer the
// numeric id or `nameEn` when wiring real API data (ASCII, spelling-stable);
// the Thai-label keys keep older mock components working.

/** FE enum names for incident event types (stable identifiers in our code). */
export type EventTypeName =
  | 'ACCIDENT'
  | 'BROKEN_DOWN_VEHICLE'
  | 'SHOULDER_PARKING'
  | 'ROAD_CONSTRUCTION'
  | 'ROAD_BLOCKED'
  | 'WRONG_WAY_DRIVING'
  | 'TRUCK_IN_RIGHT_LANE'
  | 'OVER_SPEED'
  | 'TRAFFIC_CONGESTION'
  | 'SUSPICIOUS_PERSON'

export interface EventType {
  /** Backend `analytic_type` id. 1–9 are live; 10 (SUSPICIOUS_PERSON) is reserved. */
  id: number
  /** FE enum name. */
  name: EventTypeName
  /** Backend `type_name_en` — ASCII, spelling-stable; best key for API data. */
  nameEn: string
  /** Thai display label (Figma). */
  displayName: string
  color: string
}

/** Canonical event types. Order = analytic_type id ascending. */
export const EVENT_TYPES: EventType[] = [
  { id: 1,  name: 'ACCIDENT',            nameEn: 'car_accident',      displayName: 'อุบัติเหตุ',         color: '#9D00FF' },
  { id: 2,  name: 'BROKEN_DOWN_VEHICLE', nameEn: 'car_breakdown',     displayName: 'รถเสีย',             color: '#007BFF' },
  { id: 3,  name: 'SHOULDER_PARKING',    nameEn: 'car_stop',          displayName: 'รถจอดไหล่ทาง',       color: '#00AEFF' },
  { id: 4,  name: 'ROAD_CONSTRUCTION',   nameEn: 'road_construction', displayName: 'งานก่อสร้างทาง',     color: '#00DDFF' },
  { id: 5,  name: 'ROAD_BLOCKED',        nameEn: 'road_block',        displayName: 'ปิดกั้นทาง',         color: '#00FFAA' },
  { id: 6,  name: 'WRONG_WAY_DRIVING',   nameEn: 'wrong_way',         displayName: 'รถย้อนเลน',           color: '#00FF00' },
  { id: 7,  name: 'TRUCK_IN_RIGHT_LANE', nameEn: 'truck_right',       displayName: 'รถบรรทุกเลนขวา',     color: '#C8FF00' },
  { id: 8,  name: 'OVER_SPEED',          nameEn: 'over_speed',        displayName: 'ความเร็วเกินกำหนด',   color: '#FFC800' },
  { id: 9,  name: 'TRAFFIC_CONGESTION',  nameEn: 'limit_speed',       displayName: 'จราจรติดขัด',         color: '#FF5E00' },
  // Reserved — backend does not return id 10 yet.
  { id: 10, name: 'SUSPICIOUS_PERSON',   nameEn: 'suspicious_person', displayName: 'บุคคลต้องสงสัย',     color: '#FF0000' },
]

/** Lookup by analytic_type id. */
export const EVENT_TYPE_BY_ID: Record<number, EventType> = Object.fromEntries(
  EVENT_TYPES.map((t) => [t.id, t])
)

/** Lookup by backend `type_name_en`. */
export const EVENT_TYPE_BY_EN: Record<string, EventType> = Object.fromEntries(
  EVENT_TYPES.map((t) => [t.nameEn, t])
)

/** Color lookup keyed by id-as-string, nameEn, enum name AND Thai displayName —
 *  same color whichever a caller passes. */
export const EVENT_TYPE_COLORS: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const t of EVENT_TYPES) {
    out[String(t.id)] = t.color
    out[t.nameEn] = t.color
    out[t.name] = t.color
    out[t.displayName] = t.color
  }
  // Common short alias seen in older mock data — same color as the full label.
  out['งานก่อสร้าง'] = out['ROAD_CONSTRUCTION']
  return out
})()

/** Stable fallback palette for any unknown event type. The same key always maps
 *  to the same color (hash) so colors stay consistent across renders. */
const FALLBACK_PALETTE = [
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#EF4444',
  '#14B8A6',
  '#A78BFA',
]

const hash = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Resolve the canonical color for an event type. Accepts the analytic_type id
 *  (number or numeric string), `type_name_en`, the FE enum name, or the Thai
 *  displayName. Unknown values get a stable hashed fallback so the UI never
 *  breaks. Prefer passing the id or nameEn for API-sourced data. */
export const getEventTypeColor = (key: string | number): string => {
  const k = String(key)
  if (EVENT_TYPE_COLORS[k]) return EVENT_TYPE_COLORS[k]
  return FALLBACK_PALETTE[hash(k) % FALLBACK_PALETTE.length]
}

/** Resolve the full event type from an analytic_type id (or numeric string). */
export const getEventTypeById = (id: number | string): EventType | undefined =>
  EVENT_TYPE_BY_ID[Number(id)]

/** Resolve the Thai display label from an analytic_type id, falling back to the
 *  backend-provided label when the id is unknown (e.g. a future type). */
export const getEventTypeLabel = (id: number | string, apiLabel?: string): string =>
  EVENT_TYPE_BY_ID[Number(id)]?.displayName ?? apiLabel ?? String(id)
