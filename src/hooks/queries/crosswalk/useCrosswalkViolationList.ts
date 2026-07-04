import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCrosswalkViolationListAPI } from '@/services/routes/CrosswalkService'
import type { APIRequestCrosswalkViolationList } from '@/types/crosswalk/detail-api'
import { crosswalkKeys } from './queryKeys'

/** Paginated violation events for the detail page's ViolationSection table —
 *  `GET /crosswalk/solutions/{id}/details/list`. Uses `keepPreviousData` so
 *  the table doesn't blank on page changes. */
export const useCrosswalkViolationList = (
  params: APIRequestCrosswalkViolationList
) =>
  useQuery({
    queryKey: crosswalkKeys.detail.violationList(params),
    queryFn: () => getCrosswalkViolationListAPI(params).then((r) => r.data),
    enabled: !!params.solution_id,
    placeholderData: keepPreviousData,
  })
