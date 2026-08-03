"use client"
import { useEffect, useState } from 'react'
import type { LngLatBoundsLike } from 'mapbox-gl'
import { useMap } from '../hooks/useMap'
import HTMLMarker from '../primitives/HTMLMarker'

export interface RoadSummary {
  /** Total devices on this road. */
  count: number
  /** Mean [lng, lat] of the road's devices. */
  centroid: [number, number]
  /** Road code label (e.g. "ขก.1027"). */
  label: string
  /** Device bbox [minLng, minLat, maxLng, maxLat] — fitBounds target so a
   *  long road's devices all land in view on click. */
  bounds: [number, number, number, number]
}

export interface RoadSummaryMarkerProps {
  /** Map of road id → summary. */
  summaries: Record<number, RoadSummary>
  /** Visible from this zoom (default 9 — where the ขทช. bubbles hide). */
  minZoom?: number
  /** Hide at/above this zoom (default 11.5 — where device markers render). */
  hideAtZoom?: number
  /** Force-hide the whole tier — ReactMap sets this while a clicked road is
   *  in "road focus" (device markers take over the 9–11.5 band). */
  suppressed?: boolean
  /** Fired on click (dashboard reveals overlays + enters road focus). */
  onSelect?: (roadId: number) => void
}

/**
 * สายทาง count bubbles — third aggregation tier (ขทช. → สายทาง → markers).
 * Clicking fits the map to the road's device bbox, clamped deep enough that
 * the raw markers take over.
 */
const RoadSummaryMarker: React.FC<RoadSummaryMarkerProps> = ({
  summaries,
  minZoom = 9,
  hideAtZoom = 11.5,
  suppressed = false,
  onSelect,
}) => {
  const { map, isLoaded } = useMap()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!map || !isLoaded) return
    const update = () => {
      const z = map.getZoom()
      setVisible(z >= minZoom && z < hideAtZoom)
    }
    update()
    map.on('zoom', update)
    return () => {
      map.off('zoom', update)
    }
  }, [map, isLoaded, minZoom, hideAtZoom])

  return (
    <>
      {Object.entries(summaries).map(([idStr, info]) => {
        const roadId = Number(idStr)
        if (!info || info.count === 0) return null
        return (
          <HTMLMarker
            key={roadId}
            lngLat={info.centroid}
            visible={visible && !suppressed}
            title={`${info.label} · ${info.count} จุดติดตั้ง`}
            onClick={() => {
              if (map) {
                // Fit the WHOLE road's devices — no upward clamp: road-focus
                // mode lets the raw markers render at whatever zoom the fit
                // lands on, so every device on the road stays in view (a
                // clamp into the marker band cut long roads off). Only guard
                // the bottom: below minZoom the focus hands back to the ขทช.
                // tier and the markers would vanish.
                const b: LngLatBoundsLike = [
                  [info.bounds[0], info.bounds[1]],
                  [info.bounds[2], info.bounds[3]],
                ]
                const cam = map.cameraForBounds(b, { padding: 110, maxZoom: 14.5 })
                map.flyTo({
                  center: (cam?.center as [number, number] | undefined) ?? info.centroid,
                  zoom: Math.max(typeof cam?.zoom === 'number' ? cam.zoom : 12.5, minZoom + 0.2),
                  pitch: 40,
                  duration: 1300,
                })
              }
              onSelect?.(roadId)
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* Count bubble — smallest step of the สทช. → ขทช. → สายทาง ladder. */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#FCD116',
                  color: '#050d1a',
                  fontWeight: 700,
                  fontSize: "var(--fs-12)",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(252,209,22,0.45)',
                  border: '2px solid #fff',
                  transition: 'transform 0.15s',
                }}
              >
                {info.count}
              </div>
              {/* Road-code tag — same pill language as the tiers above. */}
              <div
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(5,13,26,0.88)',
                  border: '1px solid rgba(252,209,22,0.35)',
                  color: '#FCD116',
                  fontSize: "var(--fs-12)",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {info.label}
              </div>
            </div>
          </HTMLMarker>
        )
      })}
    </>
  )
}

export default RoadSummaryMarker
