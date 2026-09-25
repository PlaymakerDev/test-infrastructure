import { z } from 'zod'
import type { APIResponseFeatureUpdates, FeatureUpdate } from '@/types/manage/feature-update-api'

// GET /manage/feature-updates/:feature — compile-time-checked against the TS
// types via `satisfies`, exercised by the fixtures in
// manage-feature-updates.test.ts (same convention as manage-notifications —
// not wired into the runtime queryFn).

export const featureUpdateSchema = z.object({
  id: z.number(),
  feature: z.string(),
  title: z.string(),
  content: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
}) satisfies z.ZodType<FeatureUpdate>

export const apiResponseFeatureUpdatesSchema = z.array(featureUpdateSchema) satisfies z.ZodType<APIResponseFeatureUpdates>
