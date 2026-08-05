"use client"
import { useEffect, useState } from 'react'
import { useMap } from '../hooks/useMap'
import HTMLMarker from '../primitives/HTMLMarker'

export interface DeptSummary {
  /** Total devices in this ขทช./แขวง. */
  count: number
  /** [lng, lat] where the bubble RENDERS — since 2026-08-05 this is the
   *  province center (from PROVINCES), falling back to the device mean for
   *  depts with no mapped province (e.g. ids missing from /departments). */
  centroid: [number, number]
  /** [lng, lat] the click flies to — the trusted device mean, so clicking
   *  still lands on the actual devices instead of a possibly-empty province
   *  center. Falls back to `centroid`. */
  flyTo?: [number, number]
}

export interface DeptSummaryMarkerProps {
  /** Map of department id → summary (count + centroid from live data). */
  summaries: Record<number, DeptSummary>
  /** department id → short name (ขทช.xxx) for the pill label. */
  labels: Map<number, string>
  /** Visible from this zoom (default 6.5 — where the สทช. bubbles hide). */
  minZoom?: number
  /** Hide at/above this zoom (default 9 — where device markers take over). */
  hideAtZoom?: number
  /** flyTo zoom on click (default 10.5 — inside the device-marker band). */
  zoomOnClick?: number
  /** Fired on click AFTER the flyTo starts — ReactMap broadcasts the dept
   *  change (cards rescope) + reveals the dashboard overlays. */
  onSelect?: (deptId: number) => void
}

/**
 * Yellow ขทช./แขวง count bubbles — the middle aggregation tier between the
 * country-level สทช. bubbles (z < 6.5) and the raw device markers (z ≥ 9).
 * Same visual language as StchSummaryMarker, slightly smaller so the two
 * tiers read as parent → child.
 */
const DeptSummaryMarker: React.FC<DeptSummaryMarkerProps> = ({
  summaries,
  labels,
  minZoom = 6.5,
  hideAtZoom = 9,
  zoomOnClick = 10.5,
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
        const deptId = Number(idStr)
        if (!info || info.count === 0) return null
        const label = labels.get(deptId) ?? (deptId === 0 ? 'ส่วนกลาง' : `ขทช. #${deptId}`)
        return (
          <HTMLMarker
            key={deptId}
            lngLat={info.centroid}
            visible={visible}
            title={`${label} · ${info.count} จุดติดตั้ง`}
            onClick={() => {
              map?.flyTo({
                center: info.flyTo ?? info.centroid,
                zoom: zoomOnClick,
                pitch: 35,
                duration: 1400,
              })
              onSelect?.(deptId)
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* Count bubble — same palette as the สทช. tier, a step smaller. */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#FCD116',
                  color: '#050d1a',
                  fontWeight: 700,
                  fontSize: "var(--fs-12)",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(252,209,22,0.5)',
                  border: '2px solid #fff',
                  transition: 'transform 0.15s',
                }}
              >
                {info.count}
              </div>
              {/* แขวง tag — mirrors the สทช. pill so the hierarchy reads on. */}
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
                {label}
              </div>
            </div>
          </HTMLMarker>
        )
      })}
    </>
  )
}

export default DeptSummaryMarker
