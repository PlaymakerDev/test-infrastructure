import { scopeQuerySuffix } from '@/services/routes/scopeParam'

export interface LightingDetailUrlOptions {
  routeId: string
  imei: string
  type: string
  deptId: string | number
}

/** Only treat the route id as an IMEI when it has an IMEI-like shape. */
export const resolveLightingImei = (
  routeId: string,
  explicitImei?: string | null,
): string => {
  const normalized = explicitImei?.trim()
  if (normalized) return normalized
  return /^\d{14,17}$/.test(routeId) ? routeId : ''
}

/** Build a portable detail URL containing every identifier needed to refetch. */
export const buildLightingDetailUrl = ({
  routeId,
  imei,
  type,
  deptId,
}: LightingDetailUrlOptions): string => {
  const base = type === 'lamp'
    ? `/admin/traffic-lighting/detail/lamp/${encodeURIComponent(routeId)}`
    : `/admin/traffic-lighting/detail/${encodeURIComponent(routeId)}`

  const params = new URLSearchParams({
    dept_id: String(deptId),
    imei,
    type,
  })

  return `${base}?${params.toString()}${scopeQuerySuffix()}`
}
