import { useQuery } from '@tanstack/react-query'
import { getVMSSettingUpcomingSummaryAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useUpcomingSummary() {
  return useQuery({
    queryKey: controlVmsKeys.upcomingSummary(),
    queryFn: () => getVMSSettingUpcomingSummaryAPI(),
  })
}
