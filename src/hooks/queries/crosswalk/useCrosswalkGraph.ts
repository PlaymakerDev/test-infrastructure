import { useQuery } from '@tanstack/react-query'
import { getCrosswalkGraphAPI } from '@/services/routes/CrosswalkService'
import type { APIRequestCrosswalkGraph } from '@/types/crosswalk/detail-api'
import { crosswalkKeys } from './queryKeys'

/** Hourly time-series for the detail page's two charts —
 *  `GET /crosswalk/solutions/{id}/details/graph?start_date=YYYY-MM-DD`.
 *  Returns `crossing_stats` + `violation_stats`, one bucket per hour. */
export const useCrosswalkGraph = (params: APIRequestCrosswalkGraph) =>
  useQuery({
    queryKey: crosswalkKeys.detail.graph(params),
    queryFn: () => getCrosswalkGraphAPI(params).then((r) => r.data),
    enabled: !!params.solution_id,
  })
