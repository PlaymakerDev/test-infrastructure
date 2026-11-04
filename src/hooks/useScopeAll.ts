"use client"
import { createContext } from 'react'
import { useSearchParams } from 'next/navigation'

/** Reactive `?scope=all` flag from the CURRENT URL via Next's router state.
 *
 *  Prefer this over reading `window.location` at render time: during an App
 *  Router transition the window URL and the committed React tree can be a
 *  render apart, which left the dashboard map holding the previous scope's
 *  query key forever (stale 3-location markers while the cards already showed
 *  the 2,520-location scope). `useSearchParams()` re-renders the subscriber
 *  exactly when the committed URL state changes, so keys/params derived from
 *  it are always consistent within a render. */
export const useScopeAll = (): boolean => {
  const params = useSearchParams()
  return params.get('scope') === 'all'
}

/** Dashboard only — true while the map has drilled the cards into กทม.
 *  (dept 0, ทช.ส่วนกลาง). Under `?scope=all` dept 0 is the whole country, so
 *  the cards stayed on the nationwide numbers there; with this set they ask
 *  for ทช.ส่วนกลาง's own department_group instead (`scope=group` — see
 *  `useDashboardScope`). Ignored on a plain URL, where dept 0 already means
 *  that one department. The dashboard provides it around the cards only: the
 *  map's own marker pool keeps the landing scope. */
export const ScopeGroupOverrideContext = createContext(false)
