import type { UserRole } from '@/hooks/useUserRole'

export type TrackingTab = 'OVERALL' | 'STATION' | 'WIM' | 'MOBILE' | 'TRACK_GPS'

export interface TrackingTabOption {
  label: string
  value: TrackingTab
}

/** Every tab this page can show, in display order. */
export const TRACKING_TAB_OPTIONS: readonly TrackingTabOption[] = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'สถานีตรวจสอบน้ำหนัก', value: 'STATION' },
  { label: 'WIM (Weight-In-Motion)', value: 'WIM' },
  { label: 'ตรวจสอบน้ำหนักเคลื่อนที่', value: 'MOBILE' },
  { label: 'ติดตาม GPS', value: 'TRACK_GPS' },
]

/** Tabs that render content inside this page. 'TRACK_GPS' is excluded on
 *  purpose — it's a shortcut into /admin/tracking/detail/gps, so it must never
 *  become `currentTab` (see the context + TitleSection docblocks). */
export const TRACKING_CONTENT_TABS = ['OVERALL', 'STATION', 'WIM', 'MOBILE'] as const

export type TrackingContentTab = (typeof TRACKING_CONTENT_TABS)[number]

/** Who sees what. Mirrors the backend role vocabulary ('admin' | 'user' |
 *  'contractor'); the server still scopes every response by the JWT role, so
 *  this map only controls what's offered in the UI. */
const ROLE_TABS: Record<UserRole, readonly TrackingTab[]> = {
  admin: ['OVERALL', 'STATION', 'WIM', 'MOBILE', 'TRACK_GPS'],
  user: ['OVERALL', 'STATION', 'WIM', 'MOBILE'],
  contractor: ['WIM'],
}

/** Tabs permitted for `role`. An unresolved or unrecognised role falls back to
 *  the plain `user` set — the backend enumerates roles as admin/user/contractor,
 *  so this only fires on corrupt profile data, and blanking the page there is
 *  worse than showing the non-privileged view. Callers that must not render the
 *  fallback should gate on `useUserRole().isResolved` first. */
export const allowedTrackingTabs = (role: UserRole | null): readonly TrackingTab[] =>
  ROLE_TABS[role ?? 'user'] ?? ROLE_TABS.user

/** As above, minus 'TRACK_GPS' — i.e. the tabs that can be `currentTab`. */
export const allowedTrackingContentTabs = (
  role: UserRole | null,
): readonly TrackingContentTab[] =>
  allowedTrackingTabs(role).filter(
    (tab): tab is TrackingContentTab =>
      (TRACKING_CONTENT_TABS as readonly string[]).includes(tab),
  )