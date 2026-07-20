import { useQuery } from '@tanstack/react-query'
import { getLPRPointStatsAPI } from '@/services/routes/LPRService'
import { lprKeys } from './queryKeys'

/** GET /lpr/points/:solution_id/stats — hourly/province/vehicle aggregate for
 *  the detail-overview charts. 60s refresh so the "today so far" bars grow
 *  through the day without page reload. */
export const useLPRPointStats = (solutionId: string | number) =>
  useQuery({
    queryKey: [...lprKeys.points.list(), 'stats', String(solutionId)] as const,
    queryFn: () => getLPRPointStatsAPI(solutionId).then((r) => r.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: !!solutionId,
  })
