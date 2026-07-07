import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getContractorsAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'
import type { ListParams } from '@/types/manage/params'

/** GET /manage/contractor — server-paginated + server-searched.
 *
 *  Returns the raw envelope `{ res_data, meta_data }`. Note that the
 *  primary key on each row is `user_id`, NOT `id`.
 */
export const useContractorsList = (params: ListParams = {}) =>
  useQuery({
    queryKey: manageKeys.contractors.list(params),
    queryFn: () => getContractorsAPI(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
