import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getVMSSettingByStatusAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSSettingByStatus(statusId?: number) {
  return useQuery({
    queryKey: controlVmsKeys.byStatusList(statusId),
    queryFn: () => getVMSSettingByStatusAPI({ status_id: statusId }),
    placeholderData: keepPreviousData,
  })
}
