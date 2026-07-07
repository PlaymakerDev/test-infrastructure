import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getGeneralUsersAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'
import type { ListParams } from '@/types/manage/params'

/** GET /manage/general_user — server-paginated but NOT server-searched.
 *
 *  /general_user ?search=… returns malformed JSON per a backend bug
 *  (task #12); the frontend filters this ONE list client-side over the
 *  small (~6 row) dataset. To keep the hook's return shape identical to
 *  the other three list hooks, we drop `search` before hitting the API,
 *  keep `search` in the query key (so it still cache-slots per term),
 *  and post-filter `res_data` on `first_name` / `lastname` / `role` /
 *  `user.username`. `meta_data.count` is patched to reflect the filtered
 *  row count so the section's pagination UI stays correct.
 */
export const useUsersList = (params: ListParams = {}) => {
  const search = params.search?.trim() ?? ''
  // Strip `search` from the network call — the endpoint 500s on it.
  const apiParams: ListParams = {
    page: params.page,
    limit: params.limit,
  }

  return useQuery({
    queryKey: manageKeys.users.list(params),
    queryFn: () => getGeneralUsersAPI(apiParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    select: (envelope) => {
      if (!search) return envelope
      const needle = search.toLowerCase()
      const filtered = envelope.res_data.filter((row) => {
        const name = `${row.first_name ?? ''} ${row.lastname ?? ''}`.toLowerCase()
        const username = row.user?.username?.toLowerCase() ?? ''
        const role = row.role?.toLowerCase() ?? ''
        return (
          name.includes(needle) ||
          username.includes(needle) ||
          role.includes(needle)
        )
      })
      return {
        ...envelope,
        res_data: filtered,
        meta_data: {
          ...envelope.meta_data,
          count: filtered.length,
          total_pages: Math.max(
            1,
            Math.ceil(filtered.length / (envelope.meta_data?.limit || 10))
          ),
        },
      }
    },
  })
}
