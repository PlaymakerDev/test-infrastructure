import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getTrafficReportsAPI } from '@/services/routes/TrafficSignalService'
import type { APIRequestTrafficReports } from '@/types/traffic-signal/detail-api'
import { trafficSignalKeys } from './queryKeys'

/** Paginated 7-day table data — feeds Tab 2 report table. */
export const useTrafficReports = (
  id: string | number | null | undefined,
  params: APIRequestTrafficReports
) =>
  useQuery({
    queryKey: trafficSignalKeys.detail.reports(id ?? '', params),
    queryFn: () => getTrafficReportsAPI(id!, params).then((r) => r.data),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
