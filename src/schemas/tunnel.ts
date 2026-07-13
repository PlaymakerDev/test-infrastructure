import { z } from 'zod'
import type {
  APIResponseTunnelCentralList,
  APIResponseTunnelOverview,
  APIResponseTunnelRandomCameras,
  APIResponseTunnelTotals,
  TunnelCentralItem,
  TunnelCentralSolution,
  TunnelCentralSubDept,
  TunnelLocation,
  TunnelRandomCamera,
} from '@/types/tunnel/overview-api'

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

const tunnelListDeviceSchema = z.object({
  camera_count: z.number(),
  lighting_count: z.number(),
  is_online: z.boolean(),
})

// ── Overview page ───────────────────────────────────────────────────────────
export const tunnelLocationSchema = z.object({
  solution: solutionSchema,
  road: roadSchema,
  tunnel: tunnelListDeviceSchema,
  GeometryPoint: lngLatSchema,
  tunnel_url: z.string().optional(),
}) satisfies z.ZodType<TunnelLocation>

export const apiResponseTunnelOverviewSchema = z.object({
  locations: z.array(tunnelLocationSchema),
  centroid: lngLatSchema.nullable().optional(),
}) satisfies z.ZodType<APIResponseTunnelOverview>

export const apiResponseTunnelTotalsSchema = z.object({
  solution: z.object({
    total: z.number(),
    online: z.number(),
    offline: z.number(),
  }),
  warranty: z.object({
    active: z.number(),
    expired: z.number(),
  }),
}) satisfies z.ZodType<APIResponseTunnelTotals>

export const tunnelRandomCameraSchema = z.object({
  camera: z.object({
    id: z.string(),
    name: z.string(),
    hls_url: z.string(),
    is_online: z.boolean(),
  }),
  road: roadSchema,
}) satisfies z.ZodType<TunnelRandomCamera>

export const apiResponseTunnelRandomCamerasSchema = z.object({
  count: z.number(),
  data: z.array(tunnelRandomCameraSchema),
}) satisfies z.ZodType<APIResponseTunnelRandomCameras>

export const tunnelCentralSolutionSchema = z.object({
  road: roadSchema,
  project: projectInfoSchema,
  solution: solutionSchema,
  tunnel: tunnelListDeviceSchema,
  is_warranty: z.boolean(),
  tunnel_url: z.string().optional(),
}) satisfies z.ZodType<TunnelCentralSolution>

export const tunnelCentralSubDeptSchema = z.object({
  department_id: z.number(),
  department_short_name: z.string(),
  solutions: z.array(tunnelCentralSolutionSchema),
}) satisfies z.ZodType<TunnelCentralSubDept>

export const tunnelCentralItemSchema = z.object({
  department_id: z.number(),
  department_short_name: z.string(),
  sub_department: z.array(tunnelCentralSubDeptSchema),
}) satisfies z.ZodType<TunnelCentralItem>

export const apiResponseTunnelCentralListSchema = z.array(
  tunnelCentralItemSchema,
) satisfies z.ZodType<APIResponseTunnelCentralList>
