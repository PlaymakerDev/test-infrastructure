import { useInfiniteQuery } from '@tanstack/react-query'
import { getVMSMediaUrlAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

const PAGE_SIZE = 12

export function useVMSMediaUrlList(settingTypeId?: number) {
  return useInfiniteQuery({
    queryKey: controlVmsKeys.mediaUrlList(settingTypeId),
    queryFn: ({ pageParam }) => getVMSMediaUrlAPI({
      ...(settingTypeId != null && { setting_type_id: settingTypeId }),
      page: pageParam,
      limit: PAGE_SIZE,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.meta_data
      return page < total_pages ? page + 1 : undefined
    },
  })
}
