import { useQuery } from '@tanstack/react-query'
import { getVMSSettingTypeAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSSettingTypes() {
  return useQuery({
    queryKey: controlVmsKeys.settingTypes(),
    queryFn: () => getVMSSettingTypeAPI(),
  })
}
