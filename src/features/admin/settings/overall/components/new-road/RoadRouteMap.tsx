"use client"
import React, { useEffect } from 'react'
import { Image } from 'antd'
import BaseMap from '@/components/map/BaseMap'
import { useMap } from '@/components/map/hooks/useMap'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'

interface Props {
  /** [lng, lat] points of the road centreline, in road order (`toRouteCoords`).
   *  Keep the reference stable — the line layer is re-added when it changes. */
  coords: [number, number][]
}

const SOURCE_ID = 'road-route-src'
const LAYER_ID = 'road-route-line'
// Mapbox paint can't read CSS variables — mirrors `--default-blue` (globals.css).
const ROUTE_COLOR = '#66AEFF'
const PIN_ICON = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/images/icon-marker/Default.svg`
// The SVG pads its drop shadow below the pin tip — shift it back onto the
// coordinate (same value as `tracking/detail/wim/.../OverallMap.tsx`).
const PIN_OFFSET: [number, number] = [0, 19]

/** Draws `coords` as one line. Renders nothing itself — must sit inside a
 *  `BaseMap`. Added after the road network, so it paints over the yellow roads. */
const RouteLine: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded || coords.length < 2) return

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      },
    })
    map.addLayer({
      id: LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ROUTE_COLOR, 'line-width': 4, 'line-opacity': 1 },
    })

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // map already torn down
      }
    }
  }, [map, isLoaded, coords])

  return null
}

/** Road preview for the road modals: the route in blue, with a white pin on the
 *  first and last point. Fills its parent's width; fixed height. */
const RoadRouteMap: React.FC<Props> = ({ coords }) => {
  const start = coords[0]
  const end = coords[coords.length - 1]

  if (coords.length < 2) {
    return (
      <div className='flex h-68 w-full items-center justify-center bg-(--dark-black) text-(--light-gray-3)'>
        ไม่พบข้อมูลพิกัดสายทาง
      </div>
    )
  }

  return (
    <div className='relative h-68 w-full'>
      <BaseMap initialCenter={start} initialZoom={13}>
        <RouteLine coords={coords} />
        <FitBoundsEffect coords={coords} padding={56} maxZoom={16} duration={0} />
        <HTMLMarker lngLat={start} anchor='bottom' offset={PIN_OFFSET} title='จุดเริ่มต้น'>
          <Image src={PIN_ICON} alt='route-start' width={52} height={55} preview={false} />
        </HTMLMarker>
        <HTMLMarker lngLat={end} anchor='bottom' offset={PIN_OFFSET} title='จุดสิ้นสุด'>
          <Image src={PIN_ICON} alt='route-end' width={52} height={55} preview={false} />
        </HTMLMarker>
      </BaseMap>
    </div>
  )
}

export default React.memo<Props>(RoadRouteMap)
