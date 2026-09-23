import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  getNotificationFeedAPI,
  markNotificationFeedReadAPI,
} from '@/services/routes/ManageService'
import type {
  APIRequestMarkFeedRead,
  APIResponseNotificationFeed,
  NotificationFeedItem,
  NotificationFeedKind,
  NotificationFeedParams,
} from '@/types/manage/notification-api'
import { manageKeys } from './queryKeys'

const BADGE_KINDS: NotificationFeedKind[] = ['case', 'camera_outage']

// Bell feed — camera outages + maintenance cases, per
// src/features/admin/maintenance/FRONTEND_NOTIFICATION_FEED.md.

/** How far back the bell looks. The endpoint's own default is 24 h, which is
 *  useless here: measured on production 2026-09-21, a 24 h window showed 6 of
 *  1,598 cases, and an open case routinely outlives a day (its due_date
 *  defaults to +7 days). One week keeps a case visible for its whole life
 *  without dragging in months of history — 835 open rows for a full-scope
 *  admin, 1 for the test contractor.
 *
 *  Passed explicitly on every call; never rely on the server default (§9.1). */
export const FEED_WINDOW_HOURS = 168

/** Only things still needing attention. The endpoint defaults to `all`, which
 *  on production means 7,119 rows in 24 h — overwhelmingly cameras that
 *  already came back — and would bury every case. `open` also matches what
 *  the bell showed before this feed existed. */
const FEED_STATUS = 'open' as const

/** Badge: unread + still-open inside the window, for ONE kind. limit=1
 *  because the number is meta_data.count, not the payload (§3). */
const badgeParams = (kind: NotificationFeedKind): NotificationFeedParams => ({
  kind,
  unread_only: true,
  status: FEED_STATUS,
  since_hours: FEED_WINDOW_HOURS,
  limit: 1,
})

const useKindBadge = (kind: NotificationFeedKind) =>
  useQuery({
    queryKey: manageKeys.notifications.feedBadge(kind),
    queryFn: () => getNotificationFeedAPI(badgeParams(kind)).then((r) => r.data),
    select: (data) => data.meta_data.count,
    refetchInterval: 60_000,
  })

/** Bell counts, split by kind — the bell shows repair cases and dead cameras
 *  as two separate numbers so one never hides the other (user 2026-09-23:
 *  a combined "99+" said nothing about whether any CASE was waiting, since
 *  outages outnumber cases ~20:1).
 *
 *  Polls every 60 s while the tab is visible (TanStack pauses refetchInterval
 *  in background tabs). A failed poll keeps the last value — the numbers must
 *  never blank out on a hiccup. Both queries share their keys with every
 *  other caller (the navbar's mobile menu), so this is still one request per
 *  kind per minute however many places read it. */
export const useNotificationFeedBadges = () => {
  const cases = useKindBadge('case')
  const outages = useKindBadge('camera_outage')
  return {
    caseCount: cases.data ?? 0,
    outageCount: outages.data ?? 0,
  }
}

/** Panel list — page-based infinite query. Enabled only while the panel is
 *  open; the badge poll is what runs in the background. */
export const useNotificationFeedInfinite = (
  params: Omit<NotificationFeedParams, 'page'> = {},
  enabled = true,
) => {
  const merged: NotificationFeedParams = {
    status: FEED_STATUS,
    since_hours: FEED_WINDOW_HOURS,
    limit: 20,
    ...params,
  }
  return useInfiniteQuery({
    queryKey: manageKeys.notifications.feedList(merged as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getNotificationFeedAPI({ ...merged, page: pageParam }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta_data.page < last.meta_data.total_pages
        ? last.meta_data.page + 1
        : undefined,
    enabled,
  })
}

type FeedListCache = InfiniteData<APIResponseNotificationFeed>

/** kind + id is the identity: the two kinds have separate id spaces, so an
 *  id alone is not unique across the feed. */
const refKey = (item: Pick<NotificationFeedItem, 'kind' | 'id'>) =>
  `${item.kind}:${item.id}`

/** POST /feed/read with optimistic UI: the unread dot and the badge flip on
 *  click, and a failed POST rolls both back. `marked` in the response is not
 *  a success signal (repeats legitimately return 0), so onSettled always
 *  refetches instead (§4). */
export const useMarkNotificationFeedRead = () => {
  const qc = useQueryClient()
  const prefix = manageKeys.notifications.feed()

  return useMutation({
    mutationFn: (body: APIRequestMarkFeedRead) =>
      markNotificationFeedReadAPI(body).then((r) => r.data),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: prefix })
      const prevBadges = BADGE_KINDS.map(
        (kind) => [kind, qc.getQueryData<APIResponseNotificationFeed>(manageKeys.notifications.feedBadge(kind))] as const,
      )
      const prevLists = qc.getQueriesData<FeedListCache>({
        queryKey: [...prefix, 'list'],
      })

      const markAll = 'all' in body
      // `all` may be scoped to one kind; 'all'/undefined means every kind.
      const allKind = markAll && body.kind && body.kind !== 'all' ? body.kind : null
      const refs = markAll ? null : new Set(body.items.map(refKey))
      const hits = (item: NotificationFeedItem) =>
        markAll ? (!allKind || item.kind === allKind) : !!refs?.has(refKey(item))

      // Unread rows this call flips, per kind. Counted by identity: the same
      // notification sits in the ทั้งหมด list AND its own kind's list once
      // both tabs have been opened, and counting it twice would push the
      // badge below the truth.
      const flipped: Record<NotificationFeedKind, Set<string>> = {
        case: new Set(),
        camera_outage: new Set(),
      }
      for (const [key, cache] of prevLists) {
        if (!cache) continue
        for (const page of cache.pages) {
          for (const item of page.res_data) {
            if (!item.is_read && hits(item)) flipped[item.kind].add(refKey(item))
          }
        }
        qc.setQueryData<FeedListCache>(key, {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            res_data: page.res_data.map((item) =>
              hits(item) ? { ...item, is_read: true } : item,
            ),
          })),
        })
      }

      for (const [kind, prev] of prevBadges) {
        if (!prev) continue
        let nextCount: number
        if (markAll) {
          // An `all` for this kind (or for every kind) empties it; an `all`
          // for the OTHER kind leaves it alone.
          nextCount = !allKind || allKind === kind ? 0 : prev.meta_data.count
        } else {
          // Rows not in any cached list still went read — fall back to how
          // many of the posted refs were of this kind.
          const posted = body.items.filter((ref) => ref.kind === kind).length
          nextCount = Math.max(0, prev.meta_data.count - (flipped[kind].size || posted))
        }
        qc.setQueryData<APIResponseNotificationFeed>(manageKeys.notifications.feedBadge(kind), {
          ...prev,
          meta_data: { ...prev.meta_data, count: nextCount },
        })
      }

      return { prevBadges, prevLists }
    },
    onError: (_err, _body, ctx) => {
      for (const [kind, prev] of ctx?.prevBadges ?? []) {
        if (prev) qc.setQueryData(manageKeys.notifications.feedBadge(kind), prev)
      }
      for (const [key, cache] of ctx?.prevLists ?? []) {
        qc.setQueryData(key, cache)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: prefix })
    },
  })
}
