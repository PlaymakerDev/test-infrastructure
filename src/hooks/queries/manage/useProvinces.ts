import { useQuery } from '@tanstack/react-query'
import { getProvincesAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/th_places/provinces — bare array of all 77 Thai provinces.
 *  Backs the Settings → Route tab's จังหวัด dropdown (the old version derived
 *  options from the current roads page only, so most provinces were missing).
 *  Static reference data → cached for the session. */
export const useProvinces = () =>
  useQuery({
    queryKey: manageKeys.dropdowns.provinces(),
    queryFn: () => getProvincesAPI().then((r) => r.data),
    staleTime: Infinity,
  })
