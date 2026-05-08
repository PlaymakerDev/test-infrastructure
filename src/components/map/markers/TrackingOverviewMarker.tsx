"use client"
import HTMLMarker from '../primitives/HTMLMarker'
import {
  TRACKING_STATION_COLORS,
  TRACKING_STATION_LABELS,
  type TrackingStation,
  type TrackingStationType,
} from '@/features/admin/tracking/overall/data/trackingStations'

// SVG icons live in /public/images/icon-marker/ — referenced by URL.
// Each icon is 43x46 with the pin tip at (21, 27) and shadow extending below.
const ICON_URL_BY_TYPE: Record<TrackingStationType, string> = {
  wim:     '/images/icon-marker/Wim.svg',
  mobile:  '/images/icon-marker/Moving.svg',
  station: '/images/icon-marker/Station.svg',
}
const ICON_WIDTH = 43
const ICON_HEIGHT = 46
// Pin tip is at SVG y=27 and the SVG bottom (with shadow padding) is at y=46
// → pin tip is 19px above the bottom edge. With anchor="bottom" the bottom edge
// sits at the lng/lat, so we offset down by 19px to land the pin tip exactly on it.
const PIN_TIP_OFFSET: [number, number] = [0, 19]

export interface TrackingOverviewMarkerProps {
  /** Stations to render — split by type, color picked from TRACKING_STATION_COLORS */
  stations: TrackingStation[]
  /** Filter by type — set undefined or pass full set to show all */
  visibleTypes?: Set<TrackingStationType>
  /** Click on a station marker (still fires even if popup is shown) */
  onClick?: (station: TrackingStation) => void
  /**
   * Click on the "ดูรายละเอียด" button inside the default popup.
   * Has no effect if `popup` is overridden — in that case the caller wires up
   * their own buttons inside the custom popup JSX.
   */
  onViewDetail?: (station: TrackingStation) => void
  /**
   * Override popup content. Pass `null` to disable popup.
   * If omitted, uses the built-in `DefaultStationPopup`.
   */
  popup?: ((station: TrackingStation) => React.ReactNode) | null
}

/**
 * Default popup body — WIM / สถานี / เคลื่อนที่ summary card.
 *
 * Layout differs by type:
 *  - mobile  → title "สายทาง [code]"  + "ผู้ตั้งด่าน : ..." line (no status)
 *  - others  → title "[name] ([code])" + "สถานะ : เปิดปกติ ●" line
 *
 * Always ends with a yellow "ดูรายละเอียด" CTA button.
 */
export function DefaultStationPopup({
  station,
  onViewDetail,
}: {
  station: TrackingStation
  onViewDetail?: (station: TrackingStation) => void
}) {
  const color = TRACKING_STATION_COLORS[station.type]
  const isMobile = station.type === 'mobile'
  const statusOn = station.status === 'open'
  const title = isMobile ? `สายทาง ${station.code}` : `${station.name} (${station.code})`

  return (
    <div
      style={{
        padding: '14px 16px',
        minWidth: 240,
        fontFamily: 'ui-sans-serif,system-ui',
        background: '#000000CC',
        border: `1px solid ${color}`,
        borderRadius: 12,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{title}</div>

      {/* เปิดด่านล่าสุด */}
      <div style={{ fontSize: 12, color: '#94a3b8' }}>
        เปิดด่านล่าสุด :{' '}
        <span style={{ color: '#fff' }}>{station.lastOpenDate}</span>
      </div>

      {/* ผู้ตั้งด่าน (mobile) | สถานะ (others) */}
      {isMobile && station.officerName ? (
        <div style={{ fontSize: 12 }}>
          <span style={{ color: '#05F2DB' }}>ผู้ตั้งด่าน : </span>
          <span style={{ color: '#fff' }}>{station.officerName}</span>
        </div>
      ) : (
        <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#06b6d4' }}>สถานะ :</span>
          <span style={{ color: '#fff' }}>{statusOn ? 'เปิดปกติ' : 'ปิด'}</span>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusOn ? '#06b6d4' : '#ef4444',
            }}
          />
        </div>
      )}

      {/* รถเข้าชั่งทั้งหมด */}
      <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: '#FCD116' }}>รถเข้าชั่งทั้งหมด</span>
        <span style={{ color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {station.totalVehicles.toLocaleString()}
        </span>
      </div>

      {/* รถเข้าน้ำหนักเกิน */}
      <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: '#FF6B6B' }}>รถเข้าน้ำหนักเกิน</span>
        <span style={{ color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {station.overweightVehicles.toLocaleString()}
        </span>
      </div>

      {/* ดูรายละเอียด CTA */}
      <button
        onClick={() => onViewDetail?.(station)}
        style={{
          marginTop: 6,
          padding: '8px 14px',
          background: '#FCD116',
          color: '#0a1428',
          border: 'none',
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 13,
          fontFamily: 'inherit',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        ดูรายละเอียด
      </button>
    </div>
  )
}

/**
 * Pin markers for the Tracking "ภาพรวม" tab — 3 colored types (WIM / สถานี / เคลื่อนที่)
 * with a default summary popup. Override `popup` for custom content per page.
 */
const TrackingOverviewMarker: React.FC<TrackingOverviewMarkerProps> = ({
  stations,
  visibleTypes,
  onClick,
  onViewDetail,
  popup,
}) => {
  return (
    <>
      {stations.map((s) => {
        const visible = visibleTypes ? visibleTypes.has(s.type) : true
        if (!visible) return null
        const popupRenderer =
          popup === null
            ? undefined
            : popup
              ? () => popup(s)
              : () => <DefaultStationPopup station={s} onViewDetail={onViewDetail} />
        return (
          <HTMLMarker
            key={s.id}
            lngLat={s.coord}
            anchor="bottom"
            offset={PIN_TIP_OFFSET}
            title={`${TRACKING_STATION_LABELS[s.type]} · ${s.name}`}
            onClick={onClick ? () => onClick(s) : undefined}
            popup={popupRenderer}
          >
            <img
              src={ICON_URL_BY_TYPE[s.type]}
              alt=""
              width={ICON_WIDTH}
              height={ICON_HEIGHT}
              draggable={false}
              style={{ display: 'block', userSelect: 'none' }}
            />
          </HTMLMarker>
        )
      })}
    </>
  )
}

export default TrackingOverviewMarker
