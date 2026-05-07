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
   * Override popup content. Pass `null` to disable popup.
   * If omitted, uses the built-in `DefaultStationPopup`.
   */
  popup?: ((station: TrackingStation) => React.ReactNode) | null
}

/** Default popup body — WIM/สถานี/เคลื่อนที่ summary card */
export function DefaultStationPopup({ station }: { station: TrackingStation }) {
  const color = TRACKING_STATION_COLORS[station.type]
  const statusOn = station.status === 'open'
  return (
    <div
      style={{
        padding: '12px 14px',
        minWidth: 220,
        fontFamily: 'ui-sans-serif,system-ui',
        background: 'rgba(5,13,26,0.96)',
        border: `1px solid ${color}`,
        borderRadius: 12,
        color: '#fff',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color }}>
        {station.name} ({station.code})
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
        เปิดด่านล่าสุด : <span style={{ color: '#fff' }}>{station.lastOpenDate}</span>
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>สถานะ :</span>
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
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px dashed rgba(255,255,255,0.15)',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          rowGap: 6,
          fontSize: 12,
        }}
      >
        <span style={{ color: '#94a3b8' }}>รถเข้าชั่งทั้งหมด</span>
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {station.totalVehicles.toLocaleString()}
        </span>
        <span style={{ color: '#94a3b8' }}>รถเข้าน้ำหนักเกิน</span>
        <span
          style={{
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: station.overweightVehicles > 0 ? '#fbbf24' : '#fff',
          }}
        >
          {station.overweightVehicles.toLocaleString()}
        </span>
      </div>
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
              : () => <DefaultStationPopup station={s} />
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
