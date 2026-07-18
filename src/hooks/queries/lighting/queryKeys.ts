export const lightingKeys = {
  all: ['lighting'] as const,
  overview: {
    root: (deptId: string | number) => [...lightingKeys.all, 'overview', deptId] as const,
    map: (deptId: string | number) => [...lightingKeys.overview.root(deptId), 'map'] as const,
  },
  topPowerRoads: {
    list: (deptId: string | number, startDate: string, endDate: string, limit?: number) =>
      [...lightingKeys.all, 'topPowerRoads', deptId, startDate, endDate, limit ?? null] as const,
  },
  diagram: (imei: string) => [...lightingKeys.all, 'diagram', imei] as const,
  alerts: (imei: string, page: number, limit: number, sort: 'ASC' | 'DESC') =>
    [...lightingKeys.all, 'alerts', imei, page, limit, sort] as const,
} as const
