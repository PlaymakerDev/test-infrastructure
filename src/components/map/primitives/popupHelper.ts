"use client"
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import type { Map as MapboxMap, Popup, PopupOptions } from 'mapbox-gl'

/**
 * Shared single-popup-per-map registry.
 * When a new popup is shown for a given map, the previous one (if any) is removed.
 * This prevents stacking popups when overlapping markers from different layers all
 * fire their click handlers in the same tick.
 */
const popupByMap = new WeakMap<MapboxMap, Popup>()

interface ShowPopupArgs {
  map: MapboxMap
  /** Imported `mapboxgl` module (already loaded in caller) */
  mb: typeof import('mapbox-gl').default
  /** Where the popup should anchor on the map */
  lngLat: [number, number]
  /** React content to render inside the popup */
  content: React.ReactNode
  /** Mapbox popup options (className, offset, closeButton, ...) */
  options?: PopupOptions
}

/**
 * Show a popup at `lngLat` containing rendered React content.
 *
 * - Closes any previously-shown popup on the same map (single-popup policy).
 * - Renders JSX synchronously (via flushSync) so the popup never appears empty.
 * - Calls `root.unmount()` on popup close to free React resources.
 */
export function showReactPopup({
  map,
  mb,
  lngLat,
  content,
  options,
}: ShowPopupArgs): Popup {
  // Close the existing popup (if any) — keep only one open at a time
  popupByMap.get(map)?.remove()

  const container = document.createElement('div')
  const root: Root = createRoot(container)
  // Render synchronously so DOM is populated before Mapbox positions the popup
  flushSync(() => {
    root.render(content)
  })

  const popup = new mb.Popup({
    offset: 14,
    closeButton: false,
    className: 'react-popup',
    ...options,
  })
    .setLngLat(lngLat)
    .setDOMContent(container)
    .addTo(map)

  popupByMap.set(map, popup)

  popup.on('close', () => {
    if (popupByMap.get(map) === popup) popupByMap.delete(map)
    // Defer unmount until after Mapbox finishes its close DOM handling
    setTimeout(() => root.unmount(), 0)
  })

  return popup
}
