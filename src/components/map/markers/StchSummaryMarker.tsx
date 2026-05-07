"use client"
import { useEffect, useState } from 'react'
import { STCH_UNITS } from '@/features/admin/dashboard/data/units'
import { useMap } from '../hooks/useMap'
import HTMLMarker from '../primitives/HTMLMarker'

export interface StchSummaryMarkerProps {
  /** Map of stch number → device count */
  counts: Record<number, number>
  /** Hide markers when zoom is at/above this value (default 6.5) */
  hideAtZoom?: number
  /** flyTo zoom on click (default 9.5) */
  zoomOnClick?: number
}

/**
 * 18 yellow circular HTML markers — one per สทช. — showing aggregated device count.
 * Used at country-level zoom; auto-hides when user zooms into province level.
 */
const StchSummaryMarker: React.FC<StchSummaryMarkerProps> = ({
  counts,
  hideAtZoom = 6.5,
  zoomOnClick = 9.5,
}) => {
  const { map, isLoaded } = useMap()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!map || !isLoaded) return
    const update = () => setVisible(map.getZoom() < hideAtZoom)
    update()
    map.on('zoom', update)
    return () => {
      map.off('zoom', update)
    }
  }, [map, isLoaded, hideAtZoom])

  return (
    <>
      {STCH_UNITS.map((unit) => {
        const count = counts[unit.stch!] ?? 0
        return (
          <HTMLMarker
            key={unit.id}
            lngLat={unit.center}
            visible={visible}
            title={`${unit.name} · ${count} อุปกรณ์`}
            onClick={() => {
              map?.flyTo({
                center: unit.center,
                zoom: zoomOnClick,
                pitch: 35,
                duration: 1500,
              })
            }}
          >
            <div style={{ width: 44, height: 44 }}>
              <div
                className="stch-marker-inner"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: '#FCD116',
                  color: '#050d1a',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(252,209,22,0.55)',
                  border: '2px solid #fff',
                  transition: 'transform 0.15s',
                  fontFamily: 'ui-sans-serif, system-ui',
                }}
              >
                {count}
              </div>
            </div>
          </HTMLMarker>
        )
      })}
    </>
  )
}

export default StchSummaryMarker
