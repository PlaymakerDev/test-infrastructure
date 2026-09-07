import { useInfiniteQuery } from '@tanstack/react-query'
import { getContractorListAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'
import type { APIRequestContractorList } from '@/types/manage/contractor-api'

/** GET /manage/contractor — infinite-scroll variant of useContractorsList,
 *  used by the contact list's onScroll pagination (NewContactSection). Each
 *  scroll-triggered fetch appends the next page instead of replacing it. */
export const useContractorListInfinite = (
  params: Omit<APIRequestContractorList, 'page'> = {},
) => {
  const merged: Omit<APIRequestContractorList, 'page'> = { limit: 10, ...params }

  return useInfiniteQuery({
    queryKey: manageKeys.contractors.listInfinite(merged),
    queryFn: ({ pageParam }) =>
      getContractorListAPI({ ...merged, page: pageParam }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta_data.page < last.meta_data.total_pages
        ? last.meta_data.page + 1
        : undefined,
  })
}
