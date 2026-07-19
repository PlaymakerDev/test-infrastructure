import { useQuery } from '@tanstack/react-query'
import { getContactDetailAPI } from '@/services/routes/SharedService'
import { sharedKeys } from './queryKeys'

/** Project/contact detail shared by the project modal and cross-feature
 * consumers. A single key prevents the same project being fetched into
 * separate feature-local caches. */
export const useContactDetail = (projectId?: string | number | null) =>
  useQuery({
    queryKey: sharedKeys.contactDetail(projectId),
    queryFn: () => getContactDetailAPI(String(projectId)),
    enabled: !!projectId,
  })
