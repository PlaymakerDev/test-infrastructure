import { scopeKey } from '@/services/routes/scopeParam'

export const isValidLightingDeptId = (
  deptId: string | number | null | undefined,
): deptId is string | number => {
  if (deptId === null || deptId === undefined || String(deptId).trim() === '') return false
  const numericId = Number(deptId)
  return Number.isInteger(numericId) && numericId >= 0
}

export const lightingKeys = {
  all: ['lighting'] as const,
  overview: {
    root: (deptId: string | number, roadId?: number | null) =>
      [...lightingKeys.all, 'overview', deptId, scopeKey(), roadId ?? null] as const,
    map: (deptId: string | number, roadId?: number | null) => [...lightingKeys.overview.root(deptId, roadId), 'map'] as const,
  },
  topPowerRoads: {
    list: (deptId: string | number, startDate: string, endDate: string, limit?: number) =>
      [...lightingKeys.all, 'topPowerRoads', deptId, startDate, endDate, limit ?? null] as const,
  },
  centralList: (deptId: string | number, roadId?: number | null) =>
    [...lightingKeys.overview.root(deptId, roadId), 'centralList'] as const,
  centralTotals: (deptId: string | number, roadId?: number | null) =>
    [...lightingKeys.overview.root(deptId, roadId), 'centralTotals'] as const,
  randomOnline: (deptId: string | number, roadId?: number | null) =>
    [...lightingKeys.overview.root(deptId, roadId), 'randomOnline'] as const,
  deviceDetails: (imei: string) => [...lightingKeys.all, 'deviceDetails', imei] as const,
  voltGraph: (imei: string, phase?: number | null) =>
    [...lightingKeys.all, 'voltGraph', imei, phase ?? null] as const,
  ampGraph: (imei: string, phase?: number | null) =>
    [...lightingKeys.all, 'ampGraph', imei, phase ?? null] as const,
  logs4gCentral: (
    imei: string,
    startDate: string | undefined,
    endDate: string | undefined,
    dataType: string | undefined,
    page: number,
    limit: number,
  ) => [
    ...lightingKeys.all,
    'logs4gCentral',
    imei,
    startDate ?? null,
    endDate ?? null,
    dataType ?? 'all',
    page,
    limit,
  ] as const,
  electricity: (
    imei: string,
    startDate: string | undefined,
    endDate: string | undefined,
    reportType: 'hourly' | 'daily' | 'monthly' | 'yearly',
  ) => [...lightingKeys.all, 'electricity', imei, startDate ?? null, endDate ?? null, reportType] as const,
  diagram: (imei: string) => [...lightingKeys.all, 'diagram', imei] as const,
  alerts: (imei: string, page: number, limit: number, sort: 'ASC' | 'DESC') =>
    [...lightingKeys.all, 'alerts', imei, page, limit, sort] as const,
} as const
