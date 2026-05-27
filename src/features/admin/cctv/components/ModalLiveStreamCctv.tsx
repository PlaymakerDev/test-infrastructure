"use client"
import React, { useMemo } from 'react'
import {
  TbMapPin, TbRss, TbScan, TbVideo, TbFileDescription, TbRefresh,
} from 'react-icons/tb'
import LiveStreamModal, {
  OutlinePill,
  StatusPill,
  type LiveStreamInfoCell,
} from '@/components/modal-live-stream/LiveStreamModal'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CctvCameraDetail {
  id: string
  name: string
  hlsUrl?: string
  location: string
  functions: string[]
  streamStatus: 'connect' | 'disconnect'
  deviceStatus: 'connect' | 'disconnect'
  ip: string
  lastUpdated?: string
}

interface Props {
  open: boolean
  onClose: () => void
  /** May be null when callers do `camera={modalCamera!}` while open=false. */
  camera: CctvCameraDetail | null
}

// CCTV-specific colors for function tags (CCTV/Incident/Volume/Traffic).
const TAG_COLORS: Record<string, { color: string; filled?: boolean }> = {
  CCTV:     { color: '#f97316' },
  Incident: { color: '#22c55e', filled: true },
  Volume:   { color: '#a3e635' },
  Traffic:  { color: '#a3e635' },
}

const FunctionTag: React.FC<{ tag: string }> = ({ tag }) => {
  const cfg = TAG_COLORS[tag] ?? { color: '#888' }
  return <OutlinePill text={tag} color={cfg.color} filled={cfg.filled} />
}

// ── Modal ─────────────────────────────────────────────────────────────────────

/** CCTV-specific Live Stream modal — wraps the central LiveStreamModal and
 *  maps a `CctvCameraDetail` into the 6-cell info grid used across CCTV
 *  detail + search pages. */
const ModalLiveStreamCctv: React.FC<Props> = ({ open, onClose, camera }) => {
  const infoCells: LiveStreamInfoCell[] = useMemo(() => {
    if (!camera) return []
    return [
      {
        icon: <TbMapPin />,
        label: 'จุดติดตั้ง',
        content: <span className='text-sm text-white text-center leading-snug'>{camera.location}</span>,
      },
      {
        icon: <TbRss />,
        label: 'ประเภทอุปกรณ์',
        content: (
          <>{camera.functions.map((fn) => <FunctionTag key={fn} tag={fn} />)}</>
        ),
      },
      {
        icon: <TbScan />,
        label: 'Stream Status',
        content: <StatusPill status={camera.streamStatus} />,
      },
      {
        icon: <TbVideo />,
        label: 'Device Status',
        content: <StatusPill status={camera.deviceStatus} />,
      },
      {
        icon: <TbFileDescription />,
        label: 'IP Address',
        content: <span className='text-sm text-white font-mono'>{camera.ip}</span>,
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
    ]
  }, [camera])

  if (!camera) return null

  return (
    <LiveStreamModal
      open={open}
      onClose={onClose}
      cameraName={camera.name}
      cameraId={camera.id}
      hlsUrl={camera.hlsUrl}
      infoCells={infoCells}
    />
  )
}

export default React.memo<Props>(ModalLiveStreamCctv)
