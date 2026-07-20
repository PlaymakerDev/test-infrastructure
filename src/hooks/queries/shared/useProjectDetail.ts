import { useQuery } from '@tanstack/react-query'
import { getProjectAPI } from '@/services/routes/SharedService'

/** Project detail (`/manage/project/{id}`). The endpoint returns `[]` for an
 *  unknown id — normalized to `null` here so consumers get one shape. */
export const useProjectDetail = (projectId?: number) =>
  useQuery({
    queryKey: ['project-detail', projectId ?? 0] as const,
    queryFn: () => getProjectAPI(projectId!).then((r) => (Array.isArray(r.data) ? null : r.data)),
    enabled: !!projectId,
  })
