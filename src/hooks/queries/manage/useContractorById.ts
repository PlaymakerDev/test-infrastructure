import { useQuery } from '@tanstack/react-query'
import { getContractorListAPI } from '@/services/routes/ManageService'
import type { ContractorData } from '@/types/manage/contractor-api'
import { manageKeys } from './queryKeys'

/** At most 100 rows a page — a larger `limit` is refused (400). */
const PAGE_LIMIT = 100

/** One contractor by user_id, with the list's counts (project_count,
 *  solution_count, solution_type_count, solution_group). GET /manage/contractor
 *  has no id filter, so this pages through it — one page today (~90 rows).
 *  Resolves `null` when no row matches (deleted, or not visible to the caller). */
export const useContractorById = (userId: string | null | undefined) =>
  useQuery({
    queryKey: manageKeys.contractors.byId(userId ?? ''),
    queryFn: async (): Promise<ContractorData | null> => {
      for (let page = 1; ; page++) {
        const { data } = await getContractorListAPI({ page, limit: PAGE_LIMIT })
        const rows = data.res_data ?? []
        const hit = rows.find((row) => row.user_id === userId)
        if (hit) return hit
        if (rows.length < PAGE_LIMIT || page >= (data.meta_data?.total_pages ?? page)) return null
      }
    },
    enabled: !!userId,
  })
