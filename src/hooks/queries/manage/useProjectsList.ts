import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getProjectsAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'
import type { ListParams } from '@/types/manage/params'

/** GET /manage/project — server-paginated + server-searched.
 *
 *  Returns the raw envelope `{ res_data, meta_data }` so the section
 *  can render both the current page of rows AND the total count / page
 *  number for its pagination UI. Sections typically destructure like:
 *
 *    const { data } = useProjectsList({ page, limit, search })
 *    const rows = data?.res_data ?? []
 *    const meta = data?.meta_data
 *
 *  `placeholderData: keepPreviousData` keeps the table stable while a
 *  new page (or search) is being fetched — no flash to empty state.
 */
export const useProjectsList = (params: ListParams = {}) =>
  useQuery({
    queryKey: manageKeys.projects.list(params),
    queryFn: () => getProjectsAPI(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
