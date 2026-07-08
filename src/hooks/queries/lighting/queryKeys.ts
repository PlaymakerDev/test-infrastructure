export const lightingKeys = {
  all: ['lighting'] as const,
  overview: {
    root: (deptId: string | number) => [...lightingKeys.all, 'overview', deptId] as const,
    map: (deptId: string | number) => [...lightingKeys.overview.root(deptId), 'map'] as const,
  },
} as const
