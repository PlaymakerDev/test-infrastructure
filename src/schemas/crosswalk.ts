import { z } from 'zod'
import type {
  APIResponseCrosswalkCentralList,
  APIResponseCrosswalkOverview,
  APIResponseCrosswalkRandomCameras,
  APIResponseCrosswalkTotals,
  CrosswalkCentralItem,
  CrosswalkCentralSolution,
  CrosswalkCentralSubDept,
  CrosswalkLocation,
  CrosswalkRandomCamera,
} from '@/types/crosswalk/overview-api'
import type {
  APIResponseCrosswalkCameras,
  APIResponseCrosswalkGraph,
  APIResponseCrosswalkSolutionDetail,
  APIResponseCrosswalkSummaryDaily,
  APIResponseCrosswalkViolationList,
  CrosswalkCameraItem,
  CrosswalkCameraSolution,
  CrosswalkCrossingBucket,
  CrosswalkViolationBucket,
  CrosswalkViolationRow,
} from '@/types/crosswalk/detail-api'
import { metaDataSchema } from './shared'

const lngLatSchema = z.tuple([z.number(), z.number()])

// ── Shared sub-schemas ──────────────────────────────────────────────────────
const roadSchema = z.object({
  id: z.number(),
  code_name: z.string(),
})

const projectInfoSchema = z.object({
  id: z.number(),
  project_name: z.string(),
  budget_year: z.number(),
  contract_no: z.string(),
})

const solutionSchema = z.object({
  id: z.number(),
  solution_name: z.string(),
})

const cameraCountsSchema = z.object({
  total: z.number(),
  online_count: z.number(),
  offline_count: z.number(),
})

const crosswalkDeviceSchema = z.object({
  total: z.number(),
  is_online: z.boolean(),
})

// ── Overview page ───────────────────────────────────────────────────────────
export const crosswalkLocationSchema = z.object({
  solution: solutionSchema,
  road: roadSchema,
  camera: cameraCountsSchema,
  crosswalk: crosswalkDeviceSchema,
  GeometryPoint: lngLatSchema,
}) satisfies z.ZodType<CrosswalkLocation>

export const apiResponseCrosswalkOverviewSchema = z.object({
  locations: z.array(crosswalkLocationSchema),
  centroid: lngLatSchema.nullable().optional(),
}) satisfies z.ZodType<APIResponseCrosswalkOverview>

export const apiResponseCrosswalkTotalsSchema = z.object({
  solution: z.object({
    total: z.number(),
    online: z.number(),
    offline: z.number(),
  }),
  warranty: z.object({
    active: z.number(),
    expired: z.number(),
  }),
}) satisfies z.ZodType<APIResponseCrosswalkTotals>

export const crosswalkRandomCameraSchema = z.object({
  camera: z.object({
    id: z.string(),
    name: z.string(),
    hls_url: z.string(),
    is_online: z.boolean(),
  }),
  road: roadSchema,
}) satisfies z.ZodType<CrosswalkRandomCamera>

export const apiResponseCrosswalkRandomCamerasSchema = z.object({
  count: z.number(),
  data: z.array(crosswalkRandomCameraSchema),
}) satisfies z.ZodType<APIResponseCrosswalkRandomCameras>

export const crosswalkCentralSolutionSchema = z.object({
  road: roadSchema,
  project: projectInfoSchema,
  solution: solutionSchema,
  camera: cameraCountsSchema,
  crosswalk: crosswalkDeviceSchema,
  is_warranty: z.boolean(),
}) satisfies z.ZodType<CrosswalkCentralSolution>

export const crosswalkCentralSubDeptSchema = z.object({
  department_id: z.number(),
  department_short_name: z.string(),
  solutions: z.array(crosswalkCentralSolutionSchema),
}) satisfies z.ZodType<CrosswalkCentralSubDept>

export const crosswalkCentralItemSchema = z.object({
  department_id: z.number(),
  department_short_name: z.string(),
  sub_department: z.array(crosswalkCentralSubDeptSchema),
}) satisfies z.ZodType<CrosswalkCentralItem>

export const apiResponseCrosswalkCentralListSchema = z.array(
  crosswalkCentralItemSchema,
) satisfies z.ZodType<APIResponseCrosswalkCentralList>

// ── Detail page ─────────────────────────────────────────────────────────────
const crosswalkCameraSolutionSchema = z.object({
  solution_id: z.number(),
  solution_name: z.string(),
}) satisfies z.ZodType<CrosswalkCameraSolution>

export const crosswalkCameraItemSchema = z.object({
  id: z.string(),
  camera_name: z.string(),
  hls_url: z.string(),
  geometry_point: lngLatSchema,
  ip_address: z.string().optional(),
  is_online: z.boolean(),
  counting: crosswalkCameraSolutionSchema.nullable(),
  analytic: crosswalkCameraSolutionSchema.nullable(),
  traffic: crosswalkCameraSolutionSchema.nullable(),
  crosswalk: crosswalkCameraSolutionSchema.nullable(),
  wim_camera: crosswalkCameraSolutionSchema.nullable(),
  vms: crosswalkCameraSolutionSchema.nullable(),
}) satisfies z.ZodType<CrosswalkCameraItem>

export const apiResponseCrosswalkCamerasSchema = z.object({
  cameras: z.array(crosswalkCameraItemSchema),
  centroid: lngLatSchema.nullable().optional(),
}) satisfies z.ZodType<APIResponseCrosswalkCameras>

export const apiResponseCrosswalkSummaryDailySchema = z.object({
  crossing: z.object({
    total: z.number(),
    button_pressed: z.number(),
    violation: z.number(),
    red_light_violation: z.number(),
  }),
  counting: z.object({
    total_count: z.number(),
    total_pcu: z.number(),
    avg_speed: z.number(),
  }),
}) satisfies z.ZodType<APIResponseCrosswalkSummaryDaily>

const crossingBucketSchema = z.object({
  hour_timestamp: z.string(),
  total_pedestrians: z.number(),
  button_pressed: z.number(),
}) satisfies z.ZodType<CrosswalkCrossingBucket>

const violationBucketSchema = z.object({
  hour_timestamp: z.string(),
  unbuttoned_crossing: z.number(),
  red_light_violation: z.number(),
}) satisfies z.ZodType<CrosswalkViolationBucket>

export const apiResponseCrosswalkGraphSchema = z.object({
  crossing_stats: z.array(crossingBucketSchema),
  violation_stats: z.array(violationBucketSchema),
}) satisfies z.ZodType<APIResponseCrosswalkGraph>

export const crosswalkViolationRowSchema = z.object({
  crosswalk: z.object({
    type: z.number(),
    name_en: z.string(),
    name_th: z.string(),
    timestamp: z.string(),
  }),
  camera: z.object({
    id: z.string(),
    name: z.string(),
    sta: z.string(),
  }),
  image_path: z.string(),
}) satisfies z.ZodType<CrosswalkViolationRow>

export const apiResponseCrosswalkViolationListSchema = z.object({
  res_data: z.array(crosswalkViolationRowSchema),
  meta_data: metaDataSchema.optional(),
}) satisfies z.ZodType<APIResponseCrosswalkViolationList>

export const apiResponseCrosswalkSolutionDetailSchema = z.object({
  id: z.number(),
  solution_name: z.string(),
  anydesk: z.union([z.number(), z.string(), z.null()]),
  geometry_point: lngLatSchema.nullable(),
}) satisfies z.ZodType<APIResponseCrosswalkSolutionDetail>
