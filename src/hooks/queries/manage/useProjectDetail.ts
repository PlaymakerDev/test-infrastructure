import { useQuery } from '@tanstack/react-query'
import { getProjectByIdAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/project/{id}. Disabled until `id` is provided so the hook
 *  is safe to mount from an edit-modal ancestor before a row is selected. */
export const useProjectDetail = (id: number | null | undefined) =>
  useQuery({
    queryKey: manageKeys.projects.detail(id ?? ''),
    queryFn: () => getProjectByIdAPI(id as number).then((r) => r.data),
    enabled: id != null,
  })
