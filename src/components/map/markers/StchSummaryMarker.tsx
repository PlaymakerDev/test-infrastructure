"use client"
import { useEffect, useState } from 'react'
import { STCH_UNITS } from '@/features/admin/dashboard/data/units'
import { BUREAU_BY_STCH } from '@/features/admin/dashboard/data/bureaus'
import { useMap } from '../hooks/useMap'
import HTMLMarker from '../primitives/HTMLMarker'

export interface StchSummary {
  /** Total devices in this สทช. */
  count: number
  /** Mean [lng, lat] of every device in this สทช. — places the marker on the
   *  actual device cluster, NOT the สทช. HQ in mock data. Also used as the
   *  flyTo target so clicking always lands on real markers. */
  centroid: [number, number]
}

export interface StchSummaryMarkerProps {
  /** Map of stch number → summary (count + centroid from live data). */
  summaries: Record<number, StchSummary>
  /** Hide markers when zoom is at/above this value (default 6.5) */
  hideAtZoom?: number
  /** flyTo zoom on click (default 9.5) */
  zoomOnClick?: number
  /** Fired when a summary bubble is clicked — dashboard reveals its overlays. */
  onMarkerClick?: () => void
}

/** Friendly name lookup — falls back to a generic label for stch numbers that
 *  the local units.ts mock doesn't know (BE has stch 0/20/21 too). */
const stchLabel = (stch: number): string => {
  const u = STCH_UNITS.find((x) => x.stch === stch)
  if (u) return u.name
  if (stch === 0) return 'ทช.ส่วนกลาง'
  return `สำนักงานทางหลวงชนบทที่ ${stch}`
}

/** Short label for the pill under each cluster marker — "สทช.10" for the 18
 *  regional bureaus, "ทช.ส่วนกลาง" for the BKK bucket. Kept ≤ 12 chars so it
 *  never wraps under the 44 px count circle. */
const stchShortLabel = (stch: number): string => {
  const b = BUREAU_BY_STCH[stch]
  if (b) return b.name
  if (stch === 0) return 'ทช.ส่วนกลาง'
  return `สทช.${stch}`
}

/**
 * Yellow circular HTML markers — one per สทช. — showing aggregated device count.
 * Used at country-level zoom; auto-hides when user zooms into province level.
 * The marker is placed on the live device centroid (NOT the mock HQ coord) so
 * clicking it always brings the user to where the devices actually are.
 */
const StchSummaryMarker: React.FC<StchSummaryMarkerProps> = ({
  summaries,
  hideAtZoom = 6.5,
  zoomOnClick = 9.5,
  onMarkerClick,
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
      {Object.entries(summaries).map(([stchStr, info]) => {
        const stch = Number(stchStr)
        if (!info || info.count === 0) return null
        return (
          <HTMLMarker
            key={stch}
            lngLat={info.centroid}
            visible={visible}
            title={`${stchLabel(stch)} · ${info.count} จุดติดตั้ง`}
            onClick={() => {
              onMarkerClick?.()
              map?.flyTo({
                center: info.centroid,
                zoom: zoomOnClick,
                pitch: 35,
                duration: 1500,
              })
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* Count bubble — yellow circle, unchanged size + shadow. */}
              <div
                className="stch-marker-inner"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#FCD116',
                  color: '#050d1a',
                  fontWeight: 700,
                  fontSize: "var(--fs-12)",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(252,209,22,0.55)',
                  border: '2px solid #fff',
                  transition: 'transform 0.15s',
                }}
              >
                {info.count}
              </div>
              {/* Bureau tag — dark pill under the bubble so users know which
                * สำนัก the count belongs to without opening the popup. Uses
                * the same yellow/dark-bg palette as the breadcrumb banner. */}
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
                {stchShortLabel(stch)}
              </div>
            </div>
          </HTMLMarker>
        )
      })}
    </>
  )
}

export default StchSummaryMarker
