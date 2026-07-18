import { useInfiniteQuery } from '@tanstack/react-query'
import { getLPRPointPlatesAPI } from '@/services/routes/LPRService'
import { lprKeys } from './queryKeys'

/** GET /lpr/points/:solution_id/plates — cursor-paginated detection stream
 *  at every camera owned by this install-point. Refetches first page every
 *  30s so "ล่าสุด" stays warm on the detail page without a WebSocket. */
export const useLPRPointPlates = (solutionId: string | number, limit = 20) =>
  useInfiniteQuery({
    queryKey: [...lprKeys.points.list(), 'plates', String(solutionId), limit] as const,
    queryFn: ({ pageParam }) =>
      getLPRPointPlatesAPI(solutionId, {
        cursor: pageParam as string | undefined,
        limit,
      }).then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.has_more && last.next_cursor ? last.next_cursor : undefined,
    enabled: !!solutionId,
    refetchInterval: 30_000,
  })
