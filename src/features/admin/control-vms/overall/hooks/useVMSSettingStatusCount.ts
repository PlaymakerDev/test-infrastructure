import { useQuery } from '@tanstack/react-query'
import { getVMSSettingStatusCountAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSSettingStatusCount() {
  return useQuery({
    queryKey: controlVmsKeys.statusCounts(),
    queryFn: () => getVMSSettingStatusCountAPI(),
  })
}
