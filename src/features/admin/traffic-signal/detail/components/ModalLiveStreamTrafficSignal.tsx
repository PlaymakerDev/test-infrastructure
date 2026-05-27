"use client"
import React, { useMemo } from 'react'
import {
  TbMapPin,
  TbRss,
  TbScan,
  TbVideo,
  TbFileDescription,
  TbRefresh,
  TbTrafficLights,
  TbCurlyLoop,
  TbTruck,
  TbVector,
  TbRoad,
} from 'react-icons/tb'
import LiveStreamModal, {
  OutlinePill,
  StatusPill,
  type LiveStreamInfoCell,
} from '@/components/modal-live-stream/LiveStreamModal'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

/** Camera entry shape used by the Traffic Signal detail page. Mirrors the
 *  in-section `CameraEntry` in `CamerasGridTrafficSignal` but lives here so
 *  the modal owns the contract. */
export interface TrafficSignalCameraDetail {
  id: string
  code: string
  ipAddress: string
  phase: number
  detectionMode: 'Counting' | 'Stopline'
  greenTime: number
  volume: number
  connection: 'online' | 'offline'
  /** Optional fields populated by backend in production */
  hlsUrl?: string
  location?: string
  functions?: string[]
  efficiency?: number
  roadType?: string
  lastUpdated?: string
}

interface Props {
  camera: TrafficSignalCameraDetail | null
  onClose: () => void
}

// CCTV-style tag colors (kept feature-local so changes here don't affect CCTV).
const TAG_COLORS: Record<string, { color: string; filled?: boolean }> = {
  CCTV:    { color: '#f97316' },
  Volume:  { color: '#a3e635' },
  Traffic: { color: '#05F2DB' },
}

const FunctionTag: React.FC<{ tag: string }> = ({ tag }) => {
  const cfg = TAG_COLORS[tag] ?? { color: '#888' }
  return <OutlinePill text={tag} color={cfg.color} filled={cfg.filled} />
}

/** Traffic-Signal Live Stream modal — wraps the central LiveStreamModal and
 *  passes 12 InfoCells (6 standard + 6 traffic-specific) so the auto-fit grid
 *  flows naturally into 2 rows. */
const ModalLiveStreamTrafficSignal: React.FC<Props> = ({ camera, onClose }) => {
  const infoCells: LiveStreamInfoCell[] = useMemo(() => {
    if (!camera) return []
    const conn = camera.connection === 'online' ? 'connect' : 'disconnect'
    const phaseColor = getPhaseColor(camera.phase)
    const fns = camera.functions ?? ['CCTV', 'Volume', 'Traffic']

    return [
      // ── Row 1: standard CCTV-style info ──────────────────────────────
      {
        icon: <TbMapPin />,
        label: 'จุดติดตั้ง',
        content: (
          <span className='text-sm text-white text-center leading-snug'>
            {camera.location ?? '-'}
          </span>
        ),
      },
      {
        icon: <TbRss />,
        label: 'ประเภทอุปกรณ์',
        content: <>{fns.map((fn) => <FunctionTag key={fn} tag={fn} />)}</>,
      },
      {
        icon: <TbScan />,
        label: 'Stream Status',
        content: <StatusPill status={conn} />,
      },
      {
        icon: <TbVideo />,
        label: 'Device Status',
        content: <StatusPill status={conn} />,
      },
      {
        icon: <TbFileDescription />,
        label: 'IP Address',
        content: <span className='text-sm text-white font-mono'>{camera.ipAddress}</span>,
      },
      {
        icon: <TbRefresh />,
        label: 'อัพเดตล่าสุด',
        content: (
          <span className='text-sm text-white text-center leading-snug'>
            {camera.lastUpdated ?? '-'}
          </span>
        ),
      },
      // ── Row 2: Traffic-Signal-specific info ──────────────────────────
      {
        icon: <TbTrafficLights />,
        label: 'แยกจราจร',
        content: (
          <span className='text-sm font-semibold' style={{ color: phaseColor }}>
            Phase {camera.phase}
          </span>
        ),
      },
      {
        icon: <TbCurlyLoop />,
        label: 'การทำงาน',
        content: (
          <OutlinePill
            text={camera.detectionMode}
            color={camera.detectionMode === 'Counting' ? '#FCD116' : '#ffffff'}
          />
        ),
      },
      {
        icon: <TbTruck />,
        label: 'ปริมาณ PCU',
        content: (
          <span className='text-sm text-white font-semibold'>
            {camera.volume.toLocaleString()}
          </span>
        ),
      },
      {
        icon: <TbVideo />,
        label: 'Green Time',
        content: (
          <span className='text-sm text-white font-semibold'>{camera.greenTime}s</span>
        ),
      },
      {
        icon: <TbVector />,
        label: 'Efficiency',
        content: (
          <span className='text-sm text-white font-semibold'>
            {camera.efficiency ?? 100}%
          </span>
        ),
      },
      {
        icon: <TbRoad />,
        label: 'ประเภทถนน',
        content: (
          <span className='text-sm text-white text-center leading-snug'>
            {camera.roadType ?? 'ถนนสายหลัก'}
          </span>
        ),
      },
    ]
  }, [camera])

  return (
    <LiveStreamModal
      open={camera !== null}
      onClose={onClose}
      cameraName={camera?.code ?? ''}
      cameraId={camera?.id}
      hlsUrl={camera?.hlsUrl}
      infoCells={infoCells}
    />
  )
}

export default React.memo(ModalLiveStreamTrafficSignal)
