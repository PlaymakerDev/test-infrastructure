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
    root: (deptId: string | number) =>
      [...lightingKeys.all, 'overview', deptId, scopeKey()] as const,
    map: (deptId: string | number) => [...lightingKeys.overview.root(deptId), 'map'] as const,
  },
  topPowerRoads: {
    list: (deptId: string | number, startDate: string, endDate: string, limit?: number) =>
      [...lightingKeys.all, 'topPowerRoads', deptId, startDate, endDate, limit ?? null] as const,
  },
  centralList: (deptId: string | number) =>
    [...lightingKeys.overview.root(deptId), 'centralList'] as const,
  centralTotals: (deptId: string | number) =>
    [...lightingKeys.overview.root(deptId), 'centralTotals'] as const,
  randomOnline: (deptId: string | number) =>
    [...lightingKeys.overview.root(deptId), 'randomOnline'] as const,
  deviceDetails: (imei: string) => [...lightingKeys.all, 'deviceDetails', imei] as const,
  voltGraph: (imei: string) => [...lightingKeys.all, 'voltGraph', imei] as const,
  ampGraph: (imei: string) => [...lightingKeys.all, 'ampGraph', imei] as const,
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
