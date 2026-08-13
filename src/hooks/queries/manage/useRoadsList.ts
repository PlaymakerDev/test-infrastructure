import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getRoadsAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'
import type { RoadListParams } from '@/types/manage/params'

/** GET /manage/roads — server-paginated + server-searched, with optional
 *  server-side `province` / `department_id` filters (RoadListParams).
 *
 *  Returns the raw envelope `{ res_data, meta_data }` so the section
 *  gets both the current page of rows and the total count / page count
 *  for its pagination UI. Rows carry `department_id`; the UI still
 *  joins client-side against /manage/departments for the label.
 */
export const useRoadsList = (params: RoadListParams = {}) =>
  useQuery({
    queryKey: manageKeys.roads.list(params),
    queryFn: () => getRoadsAPI(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
