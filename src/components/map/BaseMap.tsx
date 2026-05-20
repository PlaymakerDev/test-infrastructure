"use client"
import { useEffect, useRef, useState, useMemo } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { MapContext } from './MapContext'
import 'mapbox-gl/dist/mapbox-gl.css'

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapboxMap | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

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

  useEffect(() => {
    if (!map || !containerRef.current) return
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [map])

  const ctx = useMemo(() => ({ map, isLoaded }), [map, isLoaded])

  return (
    <MapContext.Provider value={ctx}>
      <div
        ref={containerRef}
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          ...style,
        }}
      />
      {children}
    </MapContext.Provider>
  )
}

export default BaseMap
