import { useQuery } from '@tanstack/react-query'
import { searchSSOUsersAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

// LDAP AD user lookup via the backend endpoint `GET /api-v2/auth/ldap`.
// Disabled until the trimmed keyword is at least 2 chars so we don't
// flood the upstream with single-letter probes while the operator types.
// `staleTime: 60_000` lets a repeat search within a minute (common when
// closing/reopening the modal) reuse the cache instantly.
export const useSsoSearch = (keyword: string) => {
  const trimmed = keyword.trim()
  return useQuery({
    queryKey: manageKeys.sso.search(trimmed),
    queryFn: () => searchSSOUsersAPI({ keyword: trimmed }),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  })
}
