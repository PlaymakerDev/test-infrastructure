import { useInfiniteQuery } from '@tanstack/react-query'
import { getLPRPlatesAPI } from '@/services/routes/LPRService'
import type { APIResponseLPRPlates, LPRSourceFilter } from '@/types/lpr/lpr-api'
import { lprKeys } from './queryKeys'

interface Params {
  q?: string
  source?: LPRSourceFilter
  limit?: number
}

/** Cursor-paginated plate list for the search panel. `pageParam` is the opaque
 *  `next_cursor` (undefined on the first page); walks until `has_more` is false. */
export const usePlatesInfinite = (params: Params = {}) =>
  useInfiniteQuery<APIResponseLPRPlates>({
    queryKey: lprKeys.plates.list({
      q: params.q,
      source: params.source,
      limit: params.limit,
    }),
    queryFn: ({ pageParam }) =>
      getLPRPlatesAPI({
        q: params.q,
        source: params.source,
        limit: params.limit,
        cursor: pageParam as string | undefined,
      }).then((r) => r.data),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined,
  })
