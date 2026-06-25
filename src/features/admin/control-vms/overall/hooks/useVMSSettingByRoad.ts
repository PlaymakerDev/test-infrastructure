import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getVMSSettingByRoadAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSSettingByRoad(roadCode?: string) {
  return useQuery({
    queryKey: controlVmsKeys.settingByRoadList(roadCode),
    queryFn: () => getVMSSettingByRoadAPI({ road_code: roadCode }),
    placeholderData: keepPreviousData,
  })
}
