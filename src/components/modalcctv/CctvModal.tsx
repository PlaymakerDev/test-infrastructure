"use client"
import React from 'react'
import {
  TbX, TbChevronsRight, TbMapPin, TbRss,
  TbScan, TbVideo, TbFileDescription, TbRefresh,
} from 'react-icons/tb'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CctvModalCamera {
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
  camera: CctvModalCamera
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  CCTV:     { bg: 'transparent', border: '#f97316', color: '#f97316' },
  Incident: { bg: '#22c55e',     border: '#22c55e', color: '#fff'    },
  Volume:   { bg: 'transparent', border: '#a3e635', color: '#a3e635' },
  Traffic:  { bg: 'transparent', border: '#a3e635', color: '#a3e635' },
}

const FunctionTag: React.FC<{ tag: string }> = ({ tag }) => {
  const cfg = TAG_COLORS[tag] ?? { bg: 'transparent', border: '#888', color: '#888' }
  return (
    <span
      className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap'
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {tag}
    </span>
  )
}

const StatusPill: React.FC<{ status: 'connect' | 'disconnect' }> = ({ status }) => {
  const ok = status === 'connect'
  return (
    <span
      className='inline-flex items-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${ok ? '#66AEFF' : '#E94C4C'}`, color: ok ? '#66AEFF' : '#E94C4C' }}
    >
      {ok ? 'Connect' : 'Disconnect'}
    </span>
  )
}

// ── Info cell ─────────────────────────────────────────────────────────────────

const InfoCell: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className='flex flex-col items-center gap-2 text-center min-w-0'>
    <div style={{ color: '#fff', fontSize: 22 }}>{icon}</div>
    <span className='text-xs' style={{ color: '#666' }}>{label}</span>
    <div className='flex flex-wrap justify-center gap-1'>{children}</div>
  </div>
)

// ── Modal ─────────────────────────────────────────────────────────────────────

const CctvModal: React.FC<Props> = ({ open, onClose, camera }) => {
  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-4xl rounded-2xl flex flex-col overflow-hidden'
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
            <span className='text-sm' style={{ color: '#66AEFF' }}>{camera.name}</span>
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
              cameraId={camera.id}
              hlsUrl={camera.hlsUrl}
              showLiveBadge
              style={{ height: 420, display: 'block' }}
            />
          </div>
        </div>

        {/* Device info */}
        <div className='px-6 py-5 flex flex-col gap-4 overflow-y-auto no-scrollbar'>
          <h3 className='text-base font-semibold' style={{ color: '#66AEFF' }}>ข้อมูลอุปกรณ์</h3>

          <div
            className='grid gap-6'
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
          >
            <InfoCell icon={<TbMapPin />} label='จุดติดตั้ง'>
              <span className='text-sm text-white text-center leading-snug'>{camera.location}</span>
            </InfoCell>

            <InfoCell icon={<TbRss />} label='ประเภทอุปกรณ์'>
              {camera.functions.map((fn) => <FunctionTag key={fn} tag={fn} />)}
            </InfoCell>

            <InfoCell icon={<TbScan />} label='Stream Status'>
              <StatusPill status={camera.streamStatus} />
            </InfoCell>

            <InfoCell icon={<TbVideo />} label='Device Status'>
              <StatusPill status={camera.deviceStatus} />
            </InfoCell>

            <InfoCell icon={<TbFileDescription />} label='IP Address'>
              <span className='text-sm text-white font-mono'>{camera.ip}</span>
            </InfoCell>

            <InfoCell icon={<TbRefresh />} label='อัพเดตล่าสุด'>
              <span className='text-sm text-white text-center leading-snug'>
                {camera.lastUpdated ?? '-'}
              </span>
            </InfoCell>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(CctvModal)
