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

/** Build a portable detail URL containing every identifier needed to refetch.
 *
 *  `imei` is only appended when it adds something the path doesn't already say.
 *  A device that reports an IMEI uses that IMEI as its list row id (see
 *  `trafficLightingProjects.ts`), so `routeId` and `imei` are the same string in
 *  the common case and the number would otherwise appear twice in one URL. It
 *  stays in the query for the case the split exists for: a device with no IMEI
 *  gets a synthetic `"<solutionId>-<n>"` row id, which `resolveLightingImei`
 *  deliberately refuses to read as an IMEI.
 *
 *  Parsing is unchanged, so URLs already saved with the redundant param still
 *  resolve exactly as before. */
export const buildLightingDetailUrl = ({
  routeId,
  imei,
  type,
  deptId,
}: LightingDetailUrlOptions): string => {
  const base = type === 'lamp'
    ? `/admin/traffic-lighting/detail/lamp/${encodeURIComponent(routeId)}`
    : `/admin/traffic-lighting/detail/${encodeURIComponent(routeId)}`

  const params = new URLSearchParams({ dept_id: String(deptId) })
  if (imei && imei !== routeId) params.set('imei', imei)
  params.set('type', type)

  return `${base}?${params.toString()}${scopeQuerySuffix()}`
}
