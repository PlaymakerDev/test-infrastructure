import { useQuery } from '@tanstack/react-query'
import { getVMSDepartmentAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSDepartments(params?: { since?: string }) {
  return useQuery({
    queryKey: controlVmsKeys.departmentsList(params?.since),
    queryFn: () => getVMSDepartmentAPI(params),
  })
}