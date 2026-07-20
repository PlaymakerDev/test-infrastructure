"use client"
import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import type { MapFocusMode } from '@/types/layout'
import {
  setMapFocusMode,
  toggleMapFocusMode,
  registerMapFocusConsumer,
  unregisterMapFocusConsumer,
} from '@/stores/reducers/layout/layoutSlice'

/** Shared read/write access to the Map Focus Mode. The mode is TRI-STATE
 *  (plus off): `left`, `right`, `both`, or `off`. Each MapOverlayPanel reads
 *  the mode and hides itself only when its `position` prop matches the
 *  hidden side. Consumers that only care about "is anything hidden?" can
 *  read `isMapFocus` — `true` iff mode !== 'off'.
 *
 *  `focusAvailable` is true while at least one focus-capable layout is
 *  mounted (see useRegisterMapFocusConsumer) — the navbar grays the toggle
 *  out when nothing on screen would respond to it (page without a map, or a
 *  detail TAB without one, e.g. incident-detection's รายงานเหตุการณ์). */
const useMapFocusMode = () => {
  const dispatch = useAppDispatch()
  const mode = useAppSelector((s) => s.layout.map_focus.mode)
  const focusAvailable = useAppSelector((s) => s.layout.map_focus.consumers > 0)
  const isMapFocus = mode !== 'off'

  const setMapFocus = useCallback(
    (active: boolean) => {
      dispatch(setMapFocusMode({ active }))
    },
    [dispatch]
  )

  const setMode = useCallback(
    (next: MapFocusMode) => {
      dispatch(setMapFocusMode({ mode: next }))
    },
    [dispatch]
  )

  const toggle = useCallback(() => {
    dispatch(toggleMapFocusMode())
  }, [dispatch])

  return { mode, isMapFocus, focusAvailable, setMapFocus, setMode, toggle }
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
