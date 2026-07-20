import { useInfiniteQuery } from '@tanstack/react-query'
import { getLPRPointPlatesAPI } from '@/services/routes/LPRService'
import { lprKeys } from './queryKeys'
import type { LPRSource } from '@/types/lpr/lpr-api'

export interface UseLPRPointPlatesParams {
  limit?: number
  from?: string
  to?: string
  q?: string
  source?: LPRSource | 'all'
}

/** GET /lpr/points/:solution_id/plates — cursor-paginated detection stream
 *  at every camera owned by this install-point. Optional filters (date
 *  range, plate search, source) narrow the query on the BE. First page
 *  refetches every 30s so "ล่าสุด" stays warm. */
export const useLPRPointPlates = (
  solutionId: string | number,
  params: UseLPRPointPlatesParams = {},
) => {
  const limit = params.limit ?? 20
  return useInfiniteQuery({
    queryKey: [
      ...lprKeys.points.list(),
      'plates',
      String(solutionId),
      { limit, from: params.from, to: params.to, q: params.q, source: params.source },
    ] as const,
    queryFn: ({ pageParam }) =>
      getLPRPointPlatesAPI(solutionId, {
        cursor: pageParam as string | undefined,
        limit,
        from: params.from,
        to: params.to,
        q: params.q,
        source: params.source,
      }).then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.has_more && last.next_cursor ? last.next_cursor : undefined,
    enabled: !!solutionId,
    refetchInterval: 30_000,
  })
}
