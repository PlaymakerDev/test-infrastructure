import { useInfiniteQuery } from '@tanstack/react-query'
import { getLPRTimelineAPI } from '@/services/routes/LPRService'
import type { APIResponseLPRTimeline } from '@/types/lpr/lpr-api'
import { lprKeys } from './queryKeys'

/** Cursor-paginated detection timeline for a plate. Same envelope as the plate
 *  list, but its cursor is NOT interchangeable. Enabled only once selected. */
export const useTimelineInfinite = (
  province: string | null | undefined,
  plateNumber: string | null | undefined,
  limit?: number
) =>
  useInfiniteQuery<APIResponseLPRTimeline>({
    queryKey: lprKeys.plate.timeline(province ?? '', plateNumber ?? '', limit),
    queryFn: ({ pageParam }) =>
      getLPRTimelineAPI(province!, plateNumber!, {
        limit,
        cursor: pageParam as string | undefined,
      }).then((r) => r.data),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined,
    enabled: !!province && !!plateNumber,
  })
