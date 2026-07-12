"use client"
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
