import { z } from 'zod'
import type {
  APIResponseLPRPlates,
  APIResponseLPRPlateDetail,
  APIResponseLPRTimeline,
  LPRDetectionRef,
  LPRFrequentArea,
  LPRMapPin,
  LPRMetadata,
  LPRPlateListItem,
  LPRTimelineEvent,
} from '@/types/lpr/lpr-api'

// Compile-time-checked fixtures (via `satisfies z.ZodType<...>`), mirroring the
// crosswalk/tracking schemas. Not wired into the runtime queryFn.

const sourceSchema = z.enum(['wim', 'anpr'])

// WIM records send a preformatted label ("ประเภท 1"); accept string or number.
const vehicleTypeNumberSchema = z.union([z.number(), z.string()]).nullable()

// BE added 2026-08-24 — which classification system the vehicle-type fields
// belong to ('anpr' name vs 'wim' type number). Optional for old payloads.
const vehicleTypeSourceSchema = z.enum(['anpr', 'wim']).nullable().optional()

// detection_location = [lat, lng]; missing coords = [null, null]; absent = null.
const coordsSchema = z
  .tuple([z.number().nullable(), z.number().nullable()])
  .nullable()

// ── GET /plates ─────────────────────────────────────────────────────────────
export const lprPlateListItemSchema = z.object({
  plate_number: z.string(),
  plate_province: z.string(),
  vehicle_type_name: z.string().nullable(),
  vehicle_type_number: vehicleTypeNumberSchema.optional(),
  vehicle_type_source: vehicleTypeSourceSchema,
  source: sourceSchema,
  sources: z.array(sourceSchema).optional(),
  detection_point: z.string().nullable(),
  captured_at: z.string(),
  captured_at_display: z.string(),
}) satisfies z.ZodType<LPRPlateListItem>

export const apiResponseLPRPlatesSchema = z.object({
  res_data: z.array(lprPlateListItemSchema),
  next_cursor: z.string().nullable().optional(),
  has_more: z.boolean(),
}) satisfies z.ZodType<APIResponseLPRPlates>

// ── GET /plates/:province/:number ─────────────────────────────────────────────
export const lprDetectionRefSchema = z.object({
  captured_at: z.string(),
  captured_at_display: z.string(),
  source: sourceSchema,
  detection_point: z.string().nullable(),
  camera_name: z.string().nullable(),
  detection_location: coordsSchema.optional(),
}) satisfies z.ZodType<LPRDetectionRef>

export const lprMetadataSchema = z.object({
  plate_type: z.string().nullable(),
  vehicle_type_number: vehicleTypeNumberSchema,
  vehicle_type_name: z.string().nullable(),
  vehicle_type_source: vehicleTypeSourceSchema,
  vehicle_brand: z.string().nullable(),
  vehicle_color: z.string().nullable(),
}) satisfies z.ZodType<LPRMetadata>

export const lprMapPinSchema = z.object({
  detection_point: z.string().nullable(),
  source: sourceSchema,
  count: z.number(),
  latest_captured_at: z.string(),
  latest_captured_at_display: z.string(),
  detection_location: coordsSchema,
}) satisfies z.ZodType<LPRMapPin>

export const lprFrequentAreaSchema = z.object({
  detection_point: z.string().nullable(),
  source: sourceSchema,
  count: z.number(),
  detection_location: coordsSchema,
}) satisfies z.ZodType<LPRFrequentArea>

export const apiResponseLPRPlateDetailSchema = z.object({
  plate_number: z.string(),
  plate_province: z.string(),
  first_seen: lprDetectionRefSchema,
  latest: lprDetectionRefSchema,
  metadata: lprMetadataSchema,
  map_pins: z.array(lprMapPinSchema),
  frequent_areas: z.array(lprFrequentAreaSchema),
}) satisfies z.ZodType<APIResponseLPRPlateDetail>

// ── GET /plates/:province/:number/timeline ────────────────────────────────────
export const lprTimelineEventSchema = z.object({
  id: z.number(),
  source: sourceSchema,
  captured_at: z.string(),
  captured_at_display: z.string(),
  detection_point: z.string().nullable(),
  camera_name: z.string().nullable(),
  detection_location: coordsSchema,
  vehicle_image: z.string().nullable(),
  plate_image: z.string().nullable(),
  speed: z.number().nullable(),
  lane: z.number().nullable(),
  grossweight: z.number().nullable(),
  legalweight: z.number().nullable(),
  is_overweight: z.boolean().nullable(),
}) satisfies z.ZodType<LPRTimelineEvent>

export const apiResponseLPRTimelineSchema = z.object({
  res_data: z.array(lprTimelineEventSchema),
  next_cursor: z.string().nullable().optional(),
  has_more: z.boolean(),
}) satisfies z.ZodType<APIResponseLPRTimeline>
