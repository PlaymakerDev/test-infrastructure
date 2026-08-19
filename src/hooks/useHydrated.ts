"use client"
import { useSyncExternalStore } from 'react'

/** No external store to watch — the value never changes after the first commit. */
const subscribe = () => () => {}

/**
 * `false` during SSR **and** during the client's hydration render, `true` from
 * the first post-hydration commit onward.
 *
 * Use it to gate any branch whose output depends on client-only state (Redux,
 * localStorage, `window`) that the server can't have. Without the gate, a warm
 * client store renders markup the freshly server-rendered HTML never contained
 * and React throws "Hydration failed …".
 *
 * `useSyncExternalStore` (not a `useState` + `useEffect` mount flag) because
 * React uses `getServerSnapshot` for the hydration render itself, and it avoids
 * the setState-in-effect cascade the lint rule rejects.
 */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

export default useHydrated
