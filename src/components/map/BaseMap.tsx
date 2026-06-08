"use client"
import React, { useEffect, useRef, useState, useMemo } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { MapContext } from './MapContext'
import 'mapbox-gl/dist/mapbox-gl.css'

// ─────────────────────────────────────────────────────────────────────────────
// MapEdgeFade — vignette overlay
// ─────────────────────────────────────────────────────────────────────────────
//
// Declared FIRST in this module so `BaseMap` (below) can reference it
// directly in its JSX when the optional `edgeFade` prop is provided.

export interface MapEdgeFadeProps {
  /**
   * Edge color (3- or 6-char hex). The same color is used for the opaque
   * edge AND the transparent end (with `alpha = 0`). Default `#212121`.
   */
  color?: string
  /**
   * Shortcut to set all 4 edges to the same fade distance (% from edge
   * where the gradient reaches full transparency). Individual edge props
   * (`top` / `right` / `bottom` / `left`) override this when provided.
   * Default `30`. Set `0` to disable.
   */
  all?: number
  /** Top-edge fade distance (%). `0` disables this edge. */
  top?: number
  /** Right-edge fade distance (%). `0` disables this edge. */
  right?: number
  /** Bottom-edge fade distance (%). `0` disables this edge. */
  bottom?: number
  /** Left-edge fade distance (%). `0` disables this edge. */
  left?: number
  /** Extra className appended to the overlay div. */
  className?: string
}

// Angles chosen to match the original Figma spec exactly.
const EDGE_ANGLES = {
  right: 269.92,
  left: 89.92,
  top: 359.92,
  bottom: 179.92,
} as const

/** Convert 3- or 6-char hex (e.g. `#212121`, `#000`) to `rgba(r,g,b,a)`. */
function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Vignette-style overlay that fades a map (or any element) into the
 * surrounding page background. Sits as an absolute sibling inside a
 * `position: relative` map wrapper, with `pointer-events-none` so it
 * doesn't block map interaction.
 *
 * Can be rendered standalone, OR passed as the `edgeFade` prop to
 * `<BaseMap>` to have it render inside automatically.
 *
 * @example
 * // Default vignette on all 4 edges:
 * <MapEdgeFade />
 *
 * // Heavier sides, lighter top/bottom:
 * <MapEdgeFade left={30} right={30} top={10} bottom={10} />
 *
 * // Only the right edge:
 * <MapEdgeFade all={0} right={25} />
 *
 * // Pure black instead of page bg:
 * <MapEdgeFade color='#000' />
 */
const MapEdgeFadeImpl: React.FC<MapEdgeFadeProps> = ({
  color = '#212121',
  all = 30,
  top,
  right,
  bottom,
  left,
  className,
}) => {
  const background = useMemo(() => {
    const transparent = hexToRgba(color, 0)
    const layers: string[] = []
    const sides = [
      { angle: EDGE_ANGLES.right, percent: right ?? all },
      { angle: EDGE_ANGLES.left, percent: left ?? all },
      { angle: EDGE_ANGLES.top, percent: top ?? all },
      { angle: EDGE_ANGLES.bottom, percent: bottom ?? all },
    ]
    for (const { angle, percent } of sides) {
      if (percent > 0) {
        layers.push(
          `linear-gradient(${angle}deg, ${color} 0%, ${transparent} ${percent}%)`
        )
      }
    }
    return layers.join(', ')
  }, [color, all, top, right, bottom, left])

  // Nothing to render if every edge is `0`.
  if (!background) return null

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className ?? ''}`}
      style={{ background }}
      aria-hidden
    />
  )
}

export const MapEdgeFade = React.memo(MapEdgeFadeImpl)

// ─────────────────────────────────────────────────────────────────────────────
// BaseMap — Mapbox container
// ─────────────────────────────────────────────────────────────────────────────

export interface BaseMapProps {
  children?: React.ReactNode
  /** [lng, lat] — default center of Thailand */
  initialCenter?: [number, number]
  initialZoom?: number
  initialPitch?: number
  initialBearing?: number
  /** Mapbox style URL */
  styleUrl?: string
  /** Show built-in attribution / logo (default false — full-screen dashboards usually hide them) */
  showAttribution?: boolean
  /** Optional className/style on the container */
  className?: string
  style?: React.CSSProperties
  /**
   * Optional vignette overlay rendered inside the map wrapper. Pass props
   * for `<MapEdgeFade>` here; omit (or set to `undefined`) for no overlay.
   *
   * Example:
   *   <BaseMap edgeFade={{ left: 30, right: 30, top: 10, bottom: 10 }}>
   */
  edgeFade?: MapEdgeFadeProps
}

const DEFAULT_CENTER: [number, number] = [101.5, 14.0]
const DEFAULT_ZOOM = 5.2
const DEFAULT_STYLE = 'mapbox://styles/brender99/cmno2zx3b002j01qtdbg71r0x'

const BaseMap: React.FC<BaseMapProps> = ({
  children,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  initialPitch = 0,
  initialBearing = 0,
  styleUrl = DEFAULT_STYLE,
  showAttribution = false,
  className,
  style,
  edgeFade,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapboxMap | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  // Click-to-activate state — wheel zoom is disabled by default and only
  // enabled after the user clicks on the map. Click outside (or press Esc)
  // turns it back off. Solves the "scroll over map = page hijack" issue
  // without requiring a keyboard modifier.
  const [isInteractive, setIsInteractive] = useState(false)
  const isInteractiveRef = useRef(false)
  // Timer used to debounce auto-deactivate-on-mouseleave so a brief cursor
  // drift outside the map doesn't immediately cancel zoom mode.
  const leaveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let instance: MapboxMap | null = null

    import('mapbox-gl').then(({ default: mb }) => {
      if (cancelled || !containerRef.current) return
      mb.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
      instance = new mb.Map({
        container: containerRef.current,
        style: styleUrl,
        center: initialCenter,
        zoom: initialZoom,
        pitch: initialPitch,
        bearing: initialBearing,
        attributionControl: showAttribution,
        preserveDrawingBuffer: false,
      })

      // Wheel-zoom disabled by default — enable via click-to-activate below.
      // Touch interactions (pinch / drag) stay enabled for mobile users.
      instance.scrollZoom.disable()

      instance.on('load', () => {
        if (cancelled) return
        setIsLoaded(true)
      })

      setMap(instance)
    })

    return () => {
      cancelled = true
      instance?.remove()
      setMap(null)
      setIsLoaded(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Click-to-activate scroll zoom ──────────────────────────────────────
  // Clicking inside the map wrapper enables wheel zoom; clicking outside
  // (or pressing Escape) disables it. A ref mirrors the state so the
  // document listener doesn't need re-binding when toggling.
  useEffect(() => {
    if (!map) return

    const handlePointerDown = (e: PointerEvent) => {
      const wrapper = wrapperRef.current
      if (!wrapper) return
      const isInside = wrapper.contains(e.target as Node)
      if (isInside && !isInteractiveRef.current) {
        map.scrollZoom.enable()
        isInteractiveRef.current = true
        setIsInteractive(true)
      } else if (!isInside && isInteractiveRef.current) {
        map.scrollZoom.disable()
        isInteractiveRef.current = false
        setIsInteractive(false)
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInteractiveRef.current) {
        map.scrollZoom.disable()
        isInteractiveRef.current = false
        setIsInteractive(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [map])

  // Clear pending leave-timer on unmount so it doesn't fire after teardown.
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current !== null) {
        window.clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = null
      }
    }
  }, [])

  // Auto-deactivate on cursor leave — cancels if cursor returns within 400ms.
  const handleMouseEnter = () => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }

  const handleMouseLeave = () => {
    if (!isInteractiveRef.current || !map) return
    leaveTimerRef.current = window.setTimeout(() => {
      if (isInteractiveRef.current && map) {
        map.scrollZoom.disable()
        isInteractiveRef.current = false
        setIsInteractive(false)
      }
      leaveTimerRef.current = null
    }, 400)
  }

  useEffect(() => {
    if (!map || !containerRef.current) return
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [map])

  const ctx = useMemo(() => ({ map, isLoaded }), [map, isLoaded])

  return (
    <MapContext.Provider value={ctx}>
      {/* Wrapper holds everything BaseMap renders. Used by:
        *   • document pointerdown handler — detect "inside vs outside" clicks
        *   • onMouseEnter/Leave — auto-deactivate zoom on cursor leave (400ms
        *     debounce so brief drift doesn't cancel)
        * Pointer-events stays default so mouseenter/leave fire on this div;
        * the map div + children sit on top with their own pointer-events. */}
      <div
        ref={wrapperRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'absolute', inset: 0 }}
      >
        <div
          ref={containerRef}
          className={className}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'auto',
            ...style,
          }}
        />
        {children}
        {edgeFade && <MapEdgeFade {...edgeFade} />}

        {/* Hint badge — message changes based on zoom state.
          * • Inactive: instructs user to click to activate
          * • Active:   instructs user how to exit (move mouse away / Esc) */}
        <div
          className='absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-md'
          style={{
            background: 'rgba(0,0,0,0.7)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 12,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }}
        >
          {isInteractive
            ? 'เลื่อนเมาส์ออก หรือกด ESC เพื่อยกเลิก'
            : 'คลิกเพื่อใช้งานแผนที่'}
        </div>

        {/* Active-state border — subtle inset glow indicating wheel-zoom is on. */}
        {isInteractive && (
          <div
            className='absolute inset-0'
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(252,209,22,0.25)',
              transition: 'box-shadow 0.2s',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </MapContext.Provider>
  )
}

export default BaseMap
