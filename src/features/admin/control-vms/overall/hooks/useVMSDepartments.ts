import { useQuery } from '@tanstack/react-query'
import { getVMSDepartmentAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSDepartments() {
  return useQuery({
    queryKey: controlVmsKeys.departments(),
    queryFn: () => getVMSDepartmentAPI(),
  })
}
