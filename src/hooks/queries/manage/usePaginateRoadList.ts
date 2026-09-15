import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getPaginateRoadListAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'
import type { APIRequestPaginateRoadList } from '@/types/manage/road-api'

/** GET /manage/roads — NewRoadSection's variant, server-paginated + grouped
 *  by region/department (RoadData carries the joined `department` object
 *  already, no client-side join needed). */
export const usePaginateRoadList = (params: APIRequestPaginateRoadList = {}) =>
  useQuery({
    queryKey: manageKeys.roads.listFiltered(params),
    queryFn: () => getPaginateRoadListAPI(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
