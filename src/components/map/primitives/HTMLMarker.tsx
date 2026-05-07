"use client"
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Marker as MapboxMarker, PopupOptions } from 'mapbox-gl'
import { useMap } from '../hooks/useMap'
import { showReactPopup } from './popupHelper'

export interface HTMLMarkerProps {
  /** [lng, lat] */
  lngLat: [number, number]
  children: React.ReactNode
  /** Marker anchor (default 'center') */
  anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  /**
   * Pixel offset relative to the anchor point — useful when the icon has padding
   * (e.g. shadow space below the pin tip) and you need to shift it back onto the lng/lat.
   * Positive Y moves the element DOWN, positive X moves RIGHT.
   */
  offset?: [number, number]
  /** Click handler — receives the underlying mapbox marker for flyTo etc. */
  onClick?: (marker: MapboxMarker) => void
  /** Show/hide without unmounting the React tree (default true) */
  visible?: boolean
  /** Tooltip on hover */
  title?: string
  /**
   * Render JSX inside a Mapbox popup when this marker is clicked.
   * Only one popup is open per map at a time.
   * If `onClick` is also provided, both run.
   */
  popup?: () => React.ReactNode
  /** Mapbox popup options (offset, closeButton, className, ...) */
  popupOptions?: PopupOptions
}

/**
 * DOM marker — renders any React content as a Mapbox marker via portal.
 * Use this when you need full styling control or HTML features (e.g. truck icon, animated badge).
 */
const HTMLMarker: React.FC<HTMLMarkerProps> = ({
  lngLat,
  children,
  anchor = 'center',
  offset,
  onClick,
  visible = true,
  title,
  popup,
  popupOptions,
}) => {
  const { map, isLoaded } = useMap()
  const elRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<MapboxMarker | null>(null)
  const [mounted, setMounted] = useState(false)

  // Refs for "always-latest" handler/data — read inside the click handler so we
  // don't need to detach/attach the listener on every prop change.
  const onClickRef = useRef(onClick)
  const popupRef = useRef(popup)
  const popupOptionsRef = useRef(popupOptions)
  const lngLatRef = useRef(lngLat)
  useEffect(() => { onClickRef.current = onClick }, [onClick])
  useEffect(() => { popupRef.current = popup }, [popup])
  useEffect(() => { popupOptionsRef.current = popupOptions }, [popupOptions])
  useEffect(() => { lngLatRef.current = lngLat }, [lngLat])

  // Defer DOM creation until after hydration (server returns null → matches initial client render)
  useEffect(() => {
    if (!elRef.current) {
      const el = document.createElement('div')
      el.style.cursor = 'pointer'
      // Make sure the element receives pointer events even if the parent has them disabled
      el.style.pointerEvents = 'auto'
      elRef.current = el
    }
    setMounted(true)
  }, [])

  // Mount marker on map when ready + attach click listener (kept together so
  // the listener can never be attached to a marker that isn't on the map yet).
  useEffect(() => {
    if (!map || !isLoaded || !elRef.current) return

    let cancelled = false
    let marker: MapboxMarker | null = null
    const el = elRef.current

    const handleClick = (e: MouseEvent) => {
      // Don't let the click reach the map (otherwise map's closeOnClick on the popup
      // would immediately close any popup we're about to open).
      e.stopPropagation()
      if (onClickRef.current && markerRef.current) {
        onClickRef.current(markerRef.current)
      }
      if (popupRef.current && map) {
        import('mapbox-gl').then(({ default: mb }) => {
          if (cancelled || !map) return
          showReactPopup({
            map,
            mb,
            lngLat: lngLatRef.current,
            content: popupRef.current!(),
            options: popupOptionsRef.current,
          })
        })
      }
    }
    el.addEventListener('click', handleClick)

    import('mapbox-gl').then(({ default: mb }) => {
      if (cancelled || !map || !elRef.current) return
      marker = new mb.Marker({
        element: elRef.current,
        anchor,
        ...(offset && { offset }),
      })
        .setLngLat(lngLatRef.current)
        .addTo(map)
      markerRef.current = marker
    })

    return () => {
      cancelled = true
      el.removeEventListener('click', handleClick)
      marker?.remove()
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded])

  // Update lngLat without re-creating marker
  useEffect(() => {
    markerRef.current?.setLngLat(lngLat)
  }, [lngLat])

  // Update tooltip / cursor on prop changes
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const isInteractive = !!onClick || !!popup
    el.style.cursor = isInteractive ? 'pointer' : 'default'
    if (title !== undefined) el.title = title
  }, [onClick, popup, title])

  // Visibility
  useEffect(() => {
    if (elRef.current) elRef.current.style.display = visible ? '' : 'none'
  }, [visible])

  if (!mounted || !elRef.current) return null
  return createPortal(children, elRef.current)
}

export default HTMLMarker
