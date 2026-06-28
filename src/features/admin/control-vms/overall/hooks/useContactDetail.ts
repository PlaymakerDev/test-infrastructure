import { useQuery } from '@tanstack/react-query'
import { getContactDetailAPI } from '@/services/routes/SharedService'
import { controlVmsKeys } from '../data/queryKeys'

export function useContactDetail(id?: number | string) {
  return useQuery({
    queryKey: controlVmsKeys.contact(id),
    queryFn: () => getContactDetailAPI(String(id)),
    enabled: !!id,
  })
}
