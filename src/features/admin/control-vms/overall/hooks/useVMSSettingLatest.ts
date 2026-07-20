import { useQuery } from '@tanstack/react-query'
import { getVMSSettingLatestAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSSettingLatest() {
  return useQuery({
    queryKey: controlVmsKeys.latest(),
    queryFn: () => getVMSSettingLatestAPI(),
  })
}
