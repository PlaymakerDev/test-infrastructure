"use client"
import React from 'react'
import { TbX, TbChevronsRight } from 'react-icons/tb'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LiveStreamInfoCell {
  /** Icon shown at the top of the cell (default white, ~22px). */
  icon: React.ReactNode
  /** Small gray label below the icon. */
  label: string
  /** Body of the cell — pill, plain text, or any React node. */
  content: React.ReactNode
}

export interface LiveStreamModalProps {
  open: boolean
  onClose: () => void
  /** Cyan subtitle shown under the "Live Stream" header */
  cameraName: string
  /** HLS URL forwarded to `HLSLivePlayer` */
  hlsUrl?: string
  /** Camera id forwarded to `HLSLivePlayer` */
  cameraId?: string
  /** Cells rendered in the info grid. Layout is `auto-fit minmax(120px, 1fr)`,
   *  so passing N>6 cells naturally wraps onto additional rows. */
  infoCells: LiveStreamInfoCell[]
  /** Section heading above the info grid (default 'ข้อมูลอุปกรณ์') */
  infoHeading?: string
  /** Optional max-width override (default `max-w-4xl`) */
  className?: string
}

// ── Helpers (re-exportable for callers to compose their own cells) ────────────

export const InfoCell: React.FC<{
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}> = ({ icon, label, children }) => (
  <div className='flex flex-col items-center gap-2 text-center min-w-0'>
    <div style={{ color: '#fff', fontSize: 22 }}>{icon}</div>
    <span className='fs-12' style={{ color: '#666' }}>{label}</span>
    <div className='flex flex-wrap justify-center gap-1'>{children}</div>
  </div>
)

/** Outlined pill — generic. Use for Function tags, Status badges, mode labels. */
export const OutlinePill: React.FC<{
  text: string
  color: string
  /** When true: solid bg in `color` + white text. Default false: transparent bg. */
  filled?: boolean
}> = ({ text, color, filled = false }) => (
  <span
    className='inline-flex items-center px-2.5 py-0.5 rounded-full fs-12 font-medium whitespace-nowrap'
    style={{
      background: filled ? color : 'transparent',
      border: `1px solid ${color}`,
      color: filled ? '#fff' : color,
    }}
  >
    {text}
  </span>
)

/** Connect / Disconnect status pill — pre-themed (blue / red). */
export const StatusPill: React.FC<{ status: 'connect' | 'disconnect' }> = ({ status }) => {
  const ok = status === 'connect'
  return (
    <OutlinePill
      text={ok ? 'Connect' : 'Disconnect'}
      color={ok ? '#66AEFF' : '#E94C4C'}
    />
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

const LiveStreamModal: React.FC<LiveStreamModalProps> = ({
  open,
  onClose,
  cameraName,
  hlsUrl,
  cameraId,
  infoCells,
  infoHeading = 'ข้อมูลอุปกรณ์',
  className,
}) => {
  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${className ?? 'max-w-4xl'} rounded-2xl flex flex-col overflow-hidden`}
        style={{
          background: '#111',
          border: '1.5px solid #2563EB',
          boxShadow: '0 0 40px rgba(37,99,235,0.4)',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start justify-between px-6 pt-5 pb-3 shrink-0'>
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2'>
              <TbChevronsRight size={20} color='#fff' />
              <span className='text-base font-semibold text-white'>Live Stream</span>
            </div>
            <span className='fs-12' style={{ color: '#66AEFF' }}>{cameraName}</span>
          </div>
          <button
            onClick={onClose}
            className='flex items-center justify-center w-8 h-8 rounded-full shrink-0'
            style={{ background: '#2a2a2a', border: 'none', cursor: 'pointer', color: '#fff' }}
          >
            <TbX size={16} />
          </button>
        </div>

        {/* Video */}
        <div className='px-6 shrink-0'>
          <div className='rounded-xl overflow-hidden' style={{ height: 420 }}>
            <HLSLivePlayer
              cameraId={cameraId}
              hlsUrl={hlsUrl}
              showLiveBadge
              style={{ height: 420, display: 'block' }}
            />
          </div>
        </div>

        {/* Info cells — `auto-fit minmax(120px, 1fr)` wraps naturally when
          * callers pass more than 6 cells (e.g. Traffic Signal passes 12 → 2 rows). */}
        <div className='px-6 py-5 flex flex-col gap-4 overflow-y-auto no-scrollbar'>
          <h3 className='text-base font-semibold' style={{ color: '#66AEFF' }}>
            {infoHeading}
          </h3>

          <div
            className='grid gap-6'
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
          >
            {infoCells.map((cell, i) => (
              <InfoCell key={i} icon={cell.icon} label={cell.label}>
                {cell.content}
              </InfoCell>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo<LiveStreamModalProps>(LiveStreamModal)
