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
} as const
