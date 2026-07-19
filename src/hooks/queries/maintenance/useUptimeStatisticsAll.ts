import { useQueries } from '@tanstack/react-query'
import { getUptimeStatisticsAPI } from '@/services/routes/MaintenanceService'
import type { UptimeStatistics } from '@/types/maintenance'
import { maintenanceKeys } from './queryKeys'

// The only SummaryItem.type values with a confirmed uptime-statistics
// endpoint (Counting/Analytic have none — Solution Overview hides them).
export const UPTIME_STATISTICS_TYPES = ['CCTV', 'Traffic', 'Lighting', 'VMS', 'WIM', 'Crosswalk', 'Tunnel'] as const

/** Live online percentage per solution domain, one request per domain in
 *  parallel. A failed domain is simply absent from `byType` (the caller
 *  falls back per-type), so one bad endpoint never blanks the others. */
export const useUptimeStatisticsAll = () => {
  const results = useQueries({
    queries: UPTIME_STATISTICS_TYPES.map((type) => ({
      queryKey: maintenanceKeys.uptime(type.toLowerCase()),
      queryFn: () => getUptimeStatisticsAPI(type.toLowerCase()).then((r) => r.data),
    })),
  })

  const byType: Record<string, UptimeStatistics> = {}
  results.forEach((q, i) => {
    if (q.data) byType[UPTIME_STATISTICS_TYPES[i]] = q.data
  })

  return { byType, isLoading: results.some((q) => q.isLoading) }
}
