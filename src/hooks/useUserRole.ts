"use client"
import { useMemo } from 'react'
import { useAppSelector } from '@/stores/hooks'
import { useHydrated } from './useHydrated'

/** The three roles the backend issues. Lower-case on purpose — that's the exact
 *  casing `/manage/info` returns and the casing the Go side compares against. */
export type UserRole = 'admin' | 'user' | 'contractor'

const KNOWN_ROLES: readonly string[] = ['admin', 'user', 'contractor']

export interface UserRoleState {
  /** null while unresolved, and for a role string we don't recognise. */
  role: UserRole | null
  /** `GET /manage/info` has settled (succeeded OR failed). Role-gated UI must
   *  wait for this before rendering — otherwise it renders the default set for
   *  a beat on every hard page load, which for a contractor means flashing tabs
   *  they can't have and firing their queries. */
  isResolved: boolean
  isAdmin: boolean
  isUser: boolean
  isContractor: boolean
}

/**
 * The caller's backend role, mirrored from `authSlice.info` (`GET /manage/info`,
 * hydrated once per hard entry into /admin by `components/provider/AuthHydrator`).
 *
 * Resolution follows the backend's own rule in
 * `manage/internal/middleware/page_permission_middlerware.go`: `user_type_id === 1`
 * → `contractor` (contractors have no `general_user` record, so their role never
 * comes from that object); anything else → `general_user.role` ('admin' | 'user').
 *
 * UI convenience only. Every endpoint re-derives the role from the JWT
 * server-side, so hiding a tab or a route here is a usability decision, not a
 * security boundary.
 */
export const useUserRole = (): UserRoleState => {
  const info = useAppSelector((state) => state.auth.info)
  const infoLoaded = useAppSelector((state) => state.auth.info_loaded)

  // The store is always at initialState during SSR, so a role-gated branch that
  // reads a RESOLVED role on the client's first (hydration) render emits markup
  // the server never sent → "Hydration failed" (seen on /admin/tracking, where
  // TitleSection's SwapButton is behind `isResolved &&`). That happens whenever
  // the client store is already warm while the HTML is freshly server-rendered —
  // e.g. a dev Fast-Refresh re-render of the segment. Holding resolution until
  // after mount makes the hydration render match SSR by construction; the tabs
  // then appear on the next commit (the callers already reserve the row height).
  const isResolved = useHydrated() && infoLoaded

  return useMemo(() => {
    const raw =
      info.user_type_id === 1
        ? 'contractor'
        : (info.general_user?.role ?? '').toLowerCase()
    const role = KNOWN_ROLES.includes(raw) ? (raw as UserRole) : null

    return {
      role,
      isResolved,
      isAdmin: role === 'admin',
      isUser: role === 'user',
      isContractor: role === 'contractor',
    }
  }, [info, isResolved])
}

export default useUserRole