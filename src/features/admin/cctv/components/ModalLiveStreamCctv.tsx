"use client"
import React, { useMemo } from 'react'
import {
  TbMapPin, TbRss, TbScan, TbVideo, TbFileDescription, TbRefresh,
} from 'react-icons/tb'
import LiveStreamModal, {
  StatusPill,
  type LiveStreamInfoCell,
} from '@/components/modal-live-stream/LiveStreamModal'
import { CameraFunctionTag } from '@/features/admin/cctv/components/cameraFunctions'

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
          <>{camera.functions.map((fn) => <CameraFunctionTag key={fn} tag={fn} />)}</>
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
