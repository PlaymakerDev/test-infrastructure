"use client"
import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import {
  setMapFocusMode,
  toggleMapFocusMode,
} from '@/stores/reducers/layout/layoutSlice'

/** Shared read/write access to the global Map Focus Mode flag. When active,
 *  every overall page that hosts a map hides its surrounding cards/panels/
 *  charts and lets the map take the full width. Toggled from the Navbar. */
const useMapFocusMode = () => {
  const dispatch = useAppDispatch()
  const isMapFocus = useAppSelector((s) => s.layout.map_focus.active)

  const setMapFocus = useCallback(
    (active: boolean) => {
      dispatch(setMapFocusMode({ active }))
    },
    [dispatch]
  )

  const toggle = useCallback(() => {
    dispatch(toggleMapFocusMode())
  }, [dispatch])

  return { isMapFocus, setMapFocus, toggle }
}

export default useMapFocusMode
