import { useQuery } from '@tanstack/react-query'
import { getVMSMediaByIDAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSMediaById(
  id: string | number | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: controlVmsKeys.mediaDetail(id ?? undefined),
    queryFn: () => getVMSMediaByIDAPI(id as string | number),
    enabled: enabled && !!id,
  })
}
