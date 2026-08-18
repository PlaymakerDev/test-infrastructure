import type { UserRole } from '@/hooks/useUserRole'

export type SettingsTab = 'PROJECT' | 'ROUTE' | 'CONTACT' | 'USER'

export interface SettingsTabOption {
  label: string
  value: SettingsTab
}

/** Every tab this page can show, in display order. */
export const SETTINGS_TAB_OPTIONS: readonly SettingsTabOption[] = [
  { label: 'โครงการ', value: 'PROJECT' },
  { label: 'สายทาง', value: 'ROUTE' },
  { label: 'ผู้รับจ้าง', value: 'CONTACT' },
  { label: 'ผู้ใช้งาน', value: 'USER' },
]

/** Who sees what. Mirrors the backend role vocabulary ('admin' | 'user' |
 *  'contractor'); the server still scopes every response by the JWT role, so
 *  this map only controls what's offered in the UI.
 *
 *  - **admin** — everything.
 *  - **contractor** — โครงการ only, scoped server-side to their own projects
 *    (`contractor_id = <caller>` in `manage/internal/dto/projects/repository.go`).
 *    สายทาง / ผู้รับจ้าง / ผู้ใช้งาน are admin-only route groups in
 *    `manage/internal/api/router/router.go`, so those tabs used to 403 on open.
 *  - **user** — nothing. `/manage/project` doesn't admit role `user` at all, so
 *    there is no settings surface left for them; the menu entry is hidden too
 *    (see `canOpenSettings` in `components/layout/Navbar.tsx` and
 *    `SidebarSetting.tsx`) and the page itself renders a no-access state. */
const ROLE_TABS: Record<UserRole, readonly SettingsTab[]> = {
  admin: ['PROJECT', 'ROUTE', 'CONTACT', 'USER'],
  user: [],
  contractor: ['PROJECT'],
}

/** Tabs permitted for `role`. An unresolved or unrecognised role falls back to
 *  the plain `user` set — the least-privileged one, i.e. nothing. Callers MUST
 *  therefore gate on `useUserRole().isResolved` before rendering the empty-set
 *  branch, or an admin sees the no-access state flash on every hard load. */
export const allowedSettingsTabs = (role: UserRole | null): readonly SettingsTab[] =>
  ROLE_TABS[role ?? 'user'] ?? ROLE_TABS.user