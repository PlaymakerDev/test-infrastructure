"use client"
import { memo, useMemo } from 'react'
import { STCH_UNITS } from '@/features/admin/dashboard/data/units'
import { BUREAU_BY_STCH } from '@/features/admin/dashboard/data/bureaus'
import { useMap } from '../hooks/useMap'
import { useZoomTierVisible } from '../hooks/useZoomTierVisible'
import { useChunkedReveal } from '../hooks/useChunkedReveal'
import HTMLMarker from '../primitives/HTMLMarker'

/** Stable identity so the chunked reveal doesn't restart every render. */
const EMPTY: [string, StchSummary][] = []

export interface StchSummary {
  /** Total devices in this สทช. */
  count: number
  /** [lng, lat] where the bubble RENDERS — since 2026-08-05 this is the
   *  bureau polygon's mid-point (region center, never in the sea), falling
   *  back to the device mean when no polygon exists (ทช.ส่วนกลาง). */
  centroid: [number, number]
  /** [lng, lat] the click flies to — the trusted device mean, so clicking
   *  still lands the user on the actual devices (often near a region's edge)
   *  instead of the possibly-empty region center. Falls back to `centroid`. */
  flyTo?: [number, number]
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
  const { map } = useMap()
  const visible = useZoomTierVisible((z) => z < hideAtZoom, true)
  const entries = useMemo(
    () => Object.entries(summaries).filter(([, info]) => info && info.count > 0),
    [summaries],
  )
  // Spread the mount across frames — see useChunkedReveal.
  const shown = useChunkedReveal(visible ? entries : EMPTY)

  // Unmount instead of display:none — a hidden marker is still attached to the
  // map, and mapbox re-projects + rewrites the transform of EVERY attached
  // marker on every move frame regardless of CSS. Only one tier is ever on
  // screen, so the rest were pure per-frame cost. Same rule OverlapStackMarker
  // already follows.
  // No early return when the tier is off: `shown` drains to empty a chunk
  // per frame, and bailing out here instead tore every marker down in one
  // commit — the 69ms frame the chunking was added to prevent.
  return (
    <>
      {shown.map(([stchStr, info]) => {
        const stch = Number(stchStr)
        return (
          <HTMLMarker
            key={stch}
            lngLat={info.centroid}
            title={`${stchLabel(stch)} · ${info.count} จุดติดตั้ง`}
            onClick={() => {
              onMarkerClick?.()
              map?.flyTo({
                center: info.flyTo ?? info.centroid,
                zoom: zoomOnClick,
                pitch: 35,
                duration: 1500,
              })
            }}
          >
            <div className='map-marker-in' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
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

// Memoised: ReactMap re-renders on every viewport recalc while panning, and
// this tier's whole marker list was re-rendering with it.
export default memo(StchSummaryMarker)
