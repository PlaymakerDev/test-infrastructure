import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  getCameraOutageNotificationsAPI,
  markCameraOutageReadAPI,
} from '@/services/routes/ManageService'
import type {
  APIRequestMarkCameraOutageRead,
  APIResponseCameraOutageList,
  CameraOutageListParams,
} from '@/types/manage/notification-api'
import { manageKeys } from './queryKeys'

// Camera-outage bell — hooks per docs/notifications/FRONTEND_NOTIFICATIONS.md.
// Source data refreshes every ~5 min (worker sweep) + 15-min confirm window,
// so a 60s poll is already faster than the feed can change (§5).

/** Badge params are fixed by the spec (§1): unread + still-open + last 24 h,
 *  limit=1 so the payload is one row — the number lives in meta_data.count. */
const BADGE_PARAMS: CameraOutageListParams = {
  unread_only: true,
  status: 'open',
  since_hours: 24,
  limit: 1,
}

/** Bell badge count. Polls every 60 s while the tab is visible (TanStack
 *  pauses refetchInterval in background tabs by default). On a failed poll
 *  the previous count is kept — never blank the badge on error (§5). */
export const useCameraOutageBadge = () =>
  useQuery({
    queryKey: manageKeys.notifications.cameraOutageBadge(),
    queryFn: () => getCameraOutageNotificationsAPI(BADGE_PARAMS).then((r) => r.data),
    select: (data) => data.meta_data.count,
    refetchInterval: 60_000,
  })

/** Panel list — page-based infinite query over the same endpoint. Enable only
 *  while the panel is open (§5: don't poll the list, fetch it on demand). */
export const useCameraOutageListInfinite = (
  params: Omit<CameraOutageListParams, 'page'> = {},
  enabled = true,
) => {
  const merged: CameraOutageListParams = {
    status: 'open',
    since_hours: 24,
    limit: 20,
    ...params,
  }
  return useInfiniteQuery({
    queryKey: manageKeys.notifications.cameraOutageList(
      merged as Record<string, unknown>,
    ),
    queryFn: ({ pageParam }) =>
      getCameraOutageNotificationsAPI({ ...merged, page: pageParam }).then(
        (r) => r.data,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta_data.page < last.meta_data.total_pages
        ? last.meta_data.page + 1
        : undefined,
    enabled,
  })
}

type OutageListCache = InfiniteData<APIResponseCameraOutageList>

/** POST /read with optimistic UI (§6): the unread dot and the badge flip the
 *  instant the user clicks; a failed POST rolls both back. Idempotent
 *  server-side, so retries are safe. */
export const useMarkCameraOutageRead = () => {
  const qc = useQueryClient()
  const badgeKey = manageKeys.notifications.cameraOutageBadge()
  const prefix = manageKeys.notifications.cameraOutage()

  return useMutation({
    mutationFn: (body: APIRequestMarkCameraOutageRead) =>
      markCameraOutageReadAPI(body).then((r) => r.data),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: prefix })
      const prevBadge = qc.getQueryData<APIResponseCameraOutageList>(badgeKey)
      const prevLists = qc.getQueriesData<OutageListCache>({
        queryKey: [...prefix, 'list'],
      })

      const markAll = 'all' in body
      const ids = markAll ? null : new Set(body.ids)

      // Flip is_read in every cached list page.
      for (const [key, cache] of prevLists) {
        if (!cache) continue
        qc.setQueryData<OutageListCache>(key, {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            res_data: page.res_data.map((item) =>
              markAll || ids?.has(item.id) ? { ...item, is_read: true } : item,
            ),
          })),
        })
      }

      // Badge: `all` clears it; per-id subtracts only items that were unread.
      if (prevBadge) {
        let nextCount = 0
        if (!markAll && ids) {
          let flipped = 0
          for (const [, cache] of prevLists) {
            for (const page of cache?.pages ?? []) {
              for (const item of page.res_data) {
                if (ids.has(item.id) && !item.is_read) flipped += 1
              }
            }
          }
          nextCount = Math.max(0, prevBadge.meta_data.count - (flipped || ids.size))
        }
        qc.setQueryData<APIResponseCameraOutageList>(badgeKey, {
          ...prevBadge,
          meta_data: { ...prevBadge.meta_data, count: nextCount },
        })
      }

      return { prevBadge, prevLists }
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prevBadge) qc.setQueryData(badgeKey, ctx.prevBadge)
      for (const [key, cache] of ctx?.prevLists ?? []) {
        qc.setQueryData(key, cache)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: prefix })
    },
  })
}
