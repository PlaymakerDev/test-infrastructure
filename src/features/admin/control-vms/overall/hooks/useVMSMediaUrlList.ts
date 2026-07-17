import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getVMSMediaUrlAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export const MEDIA_URL_PAGE_SIZE = 8

export function useVMSMediaUrlList(settingTypeId?: number, page = 1, limit = MEDIA_URL_PAGE_SIZE) {
  return useQuery({
    queryKey: controlVmsKeys.mediaUrlList(settingTypeId, page, limit),
    queryFn: () => getVMSMediaUrlAPI({
      ...(settingTypeId != null && { setting_type_id: settingTypeId }),
      page,
      limit,
    }),
    // Keep the previous page's items on screen while the next page loads,
    // so paging doesn't flash back to the loading skeleton every click.
    placeholderData: keepPreviousData,
  })
}
