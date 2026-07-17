"use client"
import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import {
  setMapFocusMode,
  toggleMapFocusMode,
  registerMapFocusConsumer,
  unregisterMapFocusConsumer,
} from '@/stores/reducers/layout/layoutSlice'

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
  const focusAvailable = useAppSelector((s) => s.layout.map_focus.consumers > 0)

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
