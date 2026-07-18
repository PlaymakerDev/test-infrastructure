export const bridgeLightingDetailKeys = {
  all: ['bridge-lighting-detail'] as const,
  map: () => [...bridgeLightingDetailKeys.all, 'map'] as const,
  mapDetail: (deptId: string, scope: string) => [...bridgeLightingDetailKeys.map(), deptId, scope] as const,
  wid: () => [...bridgeLightingDetailKeys.all, 'wid'] as const,
  widDetail: (id: string, scope: string) => [...bridgeLightingDetailKeys.wid(), id, scope] as const,
  pmChart: () => [...bridgeLightingDetailKeys.all, 'pmchart'] as const,
  pmChartDetail: (id: string, scope: string) => [...bridgeLightingDetailKeys.pmChart(), id, scope] as const,
  shellyStatus: () => [...bridgeLightingDetailKeys.all, 'shelly-status'] as const,
  shellyStatusDetail: (id: string, scope: string) => [...bridgeLightingDetailKeys.shellyStatus(), id, scope] as const,
}
