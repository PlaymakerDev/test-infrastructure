import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { getVMSSettingListAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

const PAGE_SIZE = 20

export function useVMSSettingListInfinite(search?: string) {
  return useInfiniteQuery({
    queryKey: controlVmsKeys.settingListSearch(search),
    queryFn: ({ pageParam }) =>
      getVMSSettingListAPI({ page: pageParam, limit: PAGE_SIZE, search }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.meta_data
      return page < total_pages ? page + 1 : undefined
    },
    placeholderData: keepPreviousData,
  })
}
