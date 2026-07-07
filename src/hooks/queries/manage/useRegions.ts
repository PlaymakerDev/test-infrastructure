import { useQuery } from '@tanstack/react-query'
import { getRegionsAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/regions — bare array, no envelope. */
export const useRegions = () =>
  useQuery({
    queryKey: manageKeys.dropdowns.regions(),
    queryFn: () => getRegionsAPI().then((r) => r.data),
  })
