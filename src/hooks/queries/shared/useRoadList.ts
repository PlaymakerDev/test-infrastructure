import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getRoadListAPI } from '@/services/routes/SharedService'
import type { APIRequestRoadList } from '@/types/shared'

/** Paginated road list (`/manage/roads`). Shared across features — e.g. the
 *  CCTV search autocomplete. `keepPreviousData` keeps options stable while the
 *  user types. */
export const useRoadList = (params: APIRequestRoadList) =>
  useQuery({
    queryKey: ['road-list', params] as const,
    queryFn: () => getRoadListAPI(params).then((r) => r.data),
    enabled: !!params.department_id,
    placeholderData: keepPreviousData,
  })
