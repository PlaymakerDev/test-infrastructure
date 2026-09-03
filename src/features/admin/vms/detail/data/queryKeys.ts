// Query-key factory for the VMS detail page, mirroring
// `bridge-lighting/detail/data/queryKeys.ts` (the template this page's
// PM-chart section was ported from). The screen's own detail query uses
// `detail(id)`; prefix keys exist per the media()/mediaList() convention so
// future invalidations can sweep a whole domain.
export const vmsDetailKeys = {
  all: ['vms-detail'] as const,
  detail: (id: string) => [...vmsDetailKeys.all, 'detail', id] as const,
  pmChart: () => [...vmsDetailKeys.all, 'pmchart'] as const,
  pmChartDetail: (solutionId: string) => [...vmsDetailKeys.pmChart(), solutionId] as const,
  pmChartHour: () => [...vmsDetailKeys.all, 'pmchart-hour'] as const,
  // Keyed by solution id + the picked CE date range so each range the export
  // modal fetches is its own cache entry and re-picking dates is instant.
  pmChartHourDetail: (solutionId: string, startDate: string, endDate: string) =>
    [...vmsDetailKeys.pmChartHour(), solutionId, startDate, endDate] as const,
}
