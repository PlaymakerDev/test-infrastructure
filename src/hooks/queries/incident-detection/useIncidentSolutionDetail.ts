import { useQuery } from '@tanstack/react-query'
// `/manage/solution/details/{id}` is a generic solution metadata endpoint —
// works for any solution_id regardless of feature (traffic-signal, analytic,
// VMS, …). Reuse the traffic-signal service rather than duplicating it.
import { getTrafficSolutionDetailAPI } from '@/services/routes/TrafficSignalService'
import { incidentKeys } from './queryKeys'

/** Solution metadata — `anydesk`, `geometry_point`, the canonical solution_name.
 *  Used by the detail title bar (AnyDesk button, Google Map button coord). */
export const useIncidentSolutionDetail = (id: string | number | null | undefined) =>
  useQuery({
    // Detail-scoped key under analytic so it doesn't collide with traffic's
    // cache key for the same endpoint (different features may want different
    // staleTime / refetch policies later).
    queryKey: [...incidentKeys.all, 'solution-detail', id ?? ''] as const,
    queryFn: () => getTrafficSolutionDetailAPI(id!).then((r) => r.data),
    enabled: !!id,
  })
