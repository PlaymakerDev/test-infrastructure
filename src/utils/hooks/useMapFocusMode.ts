"use client"
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import {
  setMapFocusMode,
  toggleMapFocusMode,
  registerMapFocusConsumer,
  unregisterMapFocusConsumer,
} from '@/stores/reducers/layout/layoutSlice'

// Hydration-safe "has the client taken over yet" flag — deliberately backed
// by useSyncExternalStore (server snapshot false, client snapshot true)
// instead of a useState+useEffect "mounted" flag, so flipping it is a normal
// external-store update rather than a setState call inside an effect body.
const subscribeNever = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

/** Shared read/write access to the global Map Focus Mode flag. When active,
 *  every overall page that hosts a map hides its surrounding cards/panels/
 *  charts and lets the map take the full width. Toggled from the Navbar.
 *
 *  `focusAvailable` is true while at least one focus-capable layout is
 *  mounted (see useRegisterMapFocusConsumer) — the navbar grays the toggle
 *  out when nothing on screen would respond to it (page without a map, or a
 *  detail TAB without one, e.g. incident-detection's รายงานเหตุการณ์). */
const useMapFocusMode = () => {
  const dispatch = useAppDispatch()
  const isMapFocus = useAppSelector((s) => s.layout.map_focus.active)
  const consumers = useAppSelector((s) => s.layout.map_focus.consumers)
  // Navbar (the toggle's only consumer) mounts inside its own <Suspense>
  // boundary (for an unrelated useSearchParams reason) and can hydrate out
  // of order relative to sibling page content. If a map-hosting page's own
  // registerMapFocusConsumer mount effect fires first, Navbar's own first
  // client render would already see consumers > 0 while the server HTML
  // (always rendered with consumers = 0, since effects never run during
  // SSR) still shows the toggle disabled — a hydration mismatch. Gating on
  // this component's own mount flag guarantees its first render always
  // matches the server's disabled state; the flip to the real value then
  // happens as an ordinary post-mount update, never during hydration.
  const hasMounted = useSyncExternalStore(subscribeNever, getClientSnapshot, getServerSnapshot)
  const focusAvailable = hasMounted && consumers > 0

  const setMapFocus = useCallback(
    (active: boolean) => {
      dispatch(setMapFocusMode({ active }))
    },
    [dispatch]
  )

  const toggle = useCallback(() => {
    dispatch(toggleMapFocusMode())
  }, [dispatch])

  return { isMapFocus, focusAvailable, setMapFocus, toggle }
}

/** Marks the calling component as a focus-capable map layout for as long as
 *  it stays mounted. MapFocusGrid and MapOverlayPanel call this for every
 *  page automatically; a component that consumes `isMapFocus` directly
 *  (without either wrapper) must call it itself, or the navbar toggle stays
 *  gray on its page. Registration is counted, so any number of panels can
 *  coexist; pass `active: false` to opt out conditionally (e.g. a disabled
 *  MapOverlayPanel that ignores focus mode). */
export const useRegisterMapFocusConsumer = (active: boolean = true) => {
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!active) return
    dispatch(registerMapFocusConsumer())
    return () => {
      dispatch(unregisterMapFocusConsumer())
    }
  }, [dispatch, active])
}

export default useMapFocusMode
