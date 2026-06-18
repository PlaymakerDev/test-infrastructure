import { useQuery } from '@tanstack/react-query'
import { getTrafficSummaryAPI } from '@/services/routes/TrafficSignalService'
import type { APIRequestTrafficSummary } from '@/types/traffic-signal/detail-api'
import { trafficSignalKeys } from './queryKeys'

/** 7-day summary — feeds Tab 2 daily cards + the 4 performance bar charts.
 *  `date` is the end-date of the 7-day window (YYYY-MM-DD). */
export const useTrafficSummary = (
  id: string | number | null | undefined,
  params: APIRequestTrafficSummary
) =>
  useQuery({
    queryKey: trafficSignalKeys.detail.summary(id ?? '', params),
    queryFn: () => getTrafficSummaryAPI(id!, params).then((r) => r.data),
    enabled: !!id && !!params.date,
  })
