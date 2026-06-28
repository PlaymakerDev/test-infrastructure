import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getVMSSettingScheduleAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSSchedule(month?: number, year?: number) {
  return useQuery({
    queryKey: controlVmsKeys.scheduleList(month, year),
    queryFn: () => getVMSSettingScheduleAPI({ month, year }),
    placeholderData: keepPreviousData,
  })
}
