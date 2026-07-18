import { useQuery } from '@tanstack/react-query'
import { getLPRPointsAPI } from '@/services/routes/LPRService'
import { lprKeys } from './queryKeys'

/** GET /lpr/points — all CCTV solutions with LPR-active cameras, aggregated
 *  with today/hour event counters + averaged coord + camera list. One query
 *  drives the whole overall page (map + KPIs + list). Refetches every 60s
 *  so counters stay warm without a WebSocket. */
export const useLPRPoints = () =>
  useQuery({
    queryKey: lprKeys.points.list(),
    queryFn: () => getLPRPointsAPI().then((r) => r.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
