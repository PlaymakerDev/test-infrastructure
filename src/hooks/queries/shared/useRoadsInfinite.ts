import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { getRoadAPI } from '@/services/routes/SharedService'

const PAGE_SIZE = 20

/** Infinite-scroll road list (`/manage/roads`) for search-as-you-type
 *  autocompletes — e.g. the sidebar's ค้นหาสายทาง box. Pair with the
 *  AutoComplete/Select's `onPopupScroll` to call `fetchNextPage()` near the
 *  bottom of the dropdown. Pass `enabled: false` to skip the request entirely
 *  (e.g. below a minimum search-length threshold). */
export const useRoadsInfinite = (search: string, options?: { enabled?: boolean }) =>
  useInfiniteQuery({
    queryKey: ['roads-infinite', search] as const,
    queryFn: ({ pageParam }) => getRoadAPI({ page: pageParam, limit: PAGE_SIZE, search }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.meta_data
      return page < total_pages ? page + 1 : undefined
    },
    enabled: options?.enabled,
    placeholderData: keepPreviousData,
  })
