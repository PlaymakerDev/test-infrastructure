import { useQuery } from '@tanstack/react-query'
import { getIncidentCameraListAPI } from '@/services/routes/AnalyticService'
import { fetchAllPages } from '@/features/admin/settings/overall/utils/fetchAllPages'
import type {
  APIRequestIncidentCameraList,
  APIResponseIncidentCameraList,
} from '@/types/incident-detection/camera-api'
import { incidentKeys } from './queryKeys'

/** EVERY camera of one solution (status, events) — detail Tab1 grid/table/
 *  export and the event modal's status lookup. The analytic service rejects
 *  `limit` > 100, and scope=all has solutions past that (970 นบ.3021 ถนน
 *  ราชพฤกษ์ = 128 cameras, 2026-10-27): reading page 1 alone silently dropped
 *  the other 28 while the chips — from /cameras/totals — still said 128.
 *  So this walks every page; callers don't pass `page`/`limit`. */
export const useIncidentCameraList = (
  deptId: string | number | null | undefined,
  params: Omit<APIRequestIncidentCameraList, 'page' | 'limit'> = {}
) =>
  useQuery({
    queryKey: incidentKeys.cameras.list(deptId ?? '', params),
    queryFn: async (): Promise<APIResponseIncidentCameraList> => {
      const rows = await fetchAllPages((page, limit) =>
        getIncidentCameraListAPI(deptId!, { ...params, page, limit }).then((r) => r.data),
      )
      return {
        res_data: rows,
        meta_data: { count: rows.length, page: 1, limit: rows.length, total_pages: 1 },
      }
    },
    enabled: !!deptId && !!params.solution_id,
  })
