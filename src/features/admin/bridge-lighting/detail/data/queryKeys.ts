export const bridgeLightingDetailKeys = {
  all: ['bridge-lighting-detail'] as const,
  map: () => [...bridgeLightingDetailKeys.all, 'map'] as const,
  // `id` (tbl_solution.id) MUST be part of the key — the queryFn passes it
  // as `solution_id` to filter the response per-bridge, but the previous
  // key omitted it and TanStack cached under (deptId, scope) alone. Every
  // detail page then hydrated with the FIRST bridge that had been fetched
  // (usually สะพานกรุงเทพ) regardless of which row / marker was clicked.
  mapDetail: (id: string, deptId: string, scope: string) =>
    [...bridgeLightingDetailKeys.map(), id, deptId, scope] as const,
  wid: () => [...bridgeLightingDetailKeys.all, 'wid'] as const,
  widDetail: (id: string, scope: string) => [...bridgeLightingDetailKeys.wid(), id, scope] as const,
  pmChart: () => [...bridgeLightingDetailKeys.all, 'pmchart'] as const,
  pmChartDetail: (id: string, scope: string) => [...bridgeLightingDetailKeys.pmChart(), id, scope] as const,
  shellyStatus: () => [...bridgeLightingDetailKeys.all, 'shelly-status'] as const,
  shellyStatusDetail: (id: string, scope: string) => [...bridgeLightingDetailKeys.shellyStatus(), id, scope] as const,
}
