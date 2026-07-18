"use client"
import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select } from 'antd'
import { TbChevronDown, TbX } from 'react-icons/tb'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { getCCTVDetailAPI } from '@/services/routes/SharedService'
import { DEVICE_BADGE, SOLUTION_BADGE_MAP } from '@/constants'
import type { PanelCamera } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  /** Cameras at the clicked marker (≥1). Length >1 → dropdown to switch. */
  cameras: PanelCamera[]
  /** Back to the overview marker view (also zooms the map out). */
  onClose: () => void
  /** Open the full Live Stream modal for the selected camera (Redux-driven,
   *  mounted once in the screen). Clicking the preview triggers this. */
  onOpenLive: (id: string) => void
}

const StatusPill: React.FC<{ online: boolean }> = ({ online }) => (
  <span
    className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${online ? '#66AEFF' : '#E94C4C'}`, color: online ? '#66AEFF' : '#E94C4C' }}
  >
    {online ? 'ออนไลน์' : 'ออฟไลน์'}
  </span>
)

const ConnectPill: React.FC<{ online: boolean }> = ({ online }) => (
  <span
    className='inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${online ? '#66AEFF' : '#E94C4C'}`, color: online ? '#66AEFF' : '#E94C4C' }}
  >
    {online ? 'Connect' : 'Disconnect'}
  </span>
)

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  // label : value on ONE line — compact so the whole panel fits without an
  // inner scrollbar; the value wraps below the label only on very narrow
  // widths (flex-wrap → mobile-safe).
  <div className='flex items-center flex-wrap gap-x-2 gap-y-1'>
    <span className='fs-12 text-gray-400 shrink-0'>{label} :</span>
    <div className='fs-13 text-white'>{children}</div>
  </div>
)

/** Right-rail device info for the camera(s) at a clicked map marker. Replaces
 *  the old marker popup: a dropdown picks among cameras sharing one coordinate,
 *  and the selected camera's live preview + device data are shown below. Data:
 *  GET /cctv/cameras/{id} (shared `['cctv_detail', id]` cache). */
const CctvMarkerInfoPanel: React.FC<Props> = ({ cameras, onClose, onOpenLive }) => {
  const [selectedId, setSelectedId] = useState(cameras[0]?.id)

  // Reset to the first camera whenever a different marker (group) is selected.
  // Adjusted during render (sanctioned pattern) rather than synchronously in
  // an effect, which the set-state-in-effect lint forbids.
  const [prevCameras, setPrevCameras] = useState(cameras)
  if (prevCameras !== cameras) {
    setPrevCameras(cameras)
    setSelectedId(cameras[0]?.id)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['cctv_detail', String(selectedId ?? '')],
    queryFn: () => getCCTVDetailAPI(String(selectedId)!),
    enabled: !!selectedId,
  })
  const cam = data?.data

  // การทำงาน badges — CCTV base + any solution the camera participates in
  // (same source as the Live Stream modal).
  const badges = [
    { ...DEVICE_BADGE.cctv },
    ...SOLUTION_BADGE_MAP.filter((s) => cam?.[s.key as keyof typeof cam]),
  ]

  const gp = cam?.geometry_point
  const latLng = Array.isArray(gp) && gp.length === 2 ? `${gp[1]}, ${gp[0]}` : '-'
  const online = !!cam?.is_online

  return (
    <div className='flex flex-col h-full'>
      {/* Header — dropdown to pick a camera + close (back to overview). */}
      <div className='p-3 shrink-0 flex items-center gap-2'>
        {/* Antd Select (not native <select>): the popup width matches the
          * trigger so a long camera name can't overflow the screen, and each
          * option wraps to max 2 lines then ellipsis (.cctv-cam-option). */}
        <div className='flex-1 min-w-0' style={{ border: '1px solid #FCD116', borderRadius: 8, background: '#1a1a1a' }}>
          <Select
            value={selectedId}
            onChange={(v) => setSelectedId(v)}
            disabled={cameras.length <= 1}
            variant='borderless'
            className='cctv-cam-select w-full'
            classNames={{ popup: { root: 'cctv-cam-dropdown' } }}
            suffixIcon={<TbChevronDown size={16} style={{ color: '#FCD116' }} />}
            options={cameras.map((c) => ({ value: c.id, label: c.name }))}
            optionRender={(opt) => <span className='cctv-cam-option'>{opt.label}</span>}
          />
        </div>
        <button
          type='button'
          onClick={onClose}
          title='ดูภาพรวมทั้งหมด'
          className='shrink-0 flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer hover:bg-white/10'
          style={{ border: '1px solid #2a2a2a', color: '#fff' }}
        >
          <TbX size={18} />
        </button>
      </div>

      {/* Symmetric horizontal padding so the camera + yellow cards sit centered
        * in the panel (the list view shifts its cards right with a dot-rail, but
        * this view has no dot — centered reads better). */}
      <div className='flex-1 overflow-y-auto px-5.5 pb-3 cctv-info-scroll'>
        {/* Camera preview card — gray, drop shadow, NO border; floats above. */}
        <div
          className='relative z-10 rounded-2xl overflow-hidden'
          style={{ background: '#232323', boxShadow: '0 16px 30px -8px rgba(0,0,0,0.85)' }}
        >
          {/* Click the preview → open the full Live Stream modal — same flow &
            * affordance as the grid/list cards (cursor-pointer, no overlay
            * button). The player is pointer-events:none so the wrapper catches
            * the click. */}
          <div
            className='cursor-pointer'
            style={{ height: 150, position: 'relative', overflow: 'hidden' }}
            onClick={() => onOpenLive(String(selectedId))}
            title='ดู Live Stream'
          >
            <HLSLivePlayer
              cameraId={String(selectedId)}
              hlsUrl={cam?.hls_url}
              showLiveBadge
              enableViewportPause
              style={{ height: 150, display: 'block', pointerEvents: 'none' }}
            />
          </div>
          {/* Extra bottom padding so the yellow card's overlap below sits in
            * empty space, not over the name/IP text. */}
          {/* Name + IP use the SAME fixed font sizes as the camera LIST card
            * (name 11px, IP 10px) — the fs-12/fs-12 utilities clamp up to 12px
            * on wide screens, so inline px is used to match the list exactly. */}
          <div className='px-3 pt-2.5 pb-5'>
            <p className='leading-snug wrap-break-word line-clamp-2 mb-1' style={{ fontSize: 11, color: online ? '#66AEFF' : '#E94C4C' }}>
              {cam?.camera_name ?? cameras.find((c) => c.id === selectedId)?.name ?? '-'}
            </p>
            <p className='mb-0' style={{ fontSize: 10, color: '#6b7280' }}>IP Address : {cam?.ip_address || '-'}</p>
          </div>
        </div>

        {/* ข้อมูลอุปกรณ์ — SEPARATE card below with the thick yellow border,
          * tucked slightly under the camera card above (whose shadow falls
          * onto it). The camera card itself has no yellow border. */}
        <div
          className='relative rounded-2xl'
          style={{ border: '2px solid #FCD116', background: '#0d0d0d', marginTop: -16, padding: '24px 14px 14px' }}
        >
          <h4 className='mb-2.5' style={{ color: 'var(--yellow)' }}>ข้อมูลอุปกรณ์</h4>
          {isLoading && !cam ? (
            <div className='py-4 text-center text-white/40 fs-12'>กำลังโหลด...</div>
          ) : (
            <div className='flex flex-col gap-2.5'>
              <InfoRow label='Latitude, Longitude'>{latLng}</InfoRow>
              <InfoRow label='ยี่ห้อ'>{cam?.brand || '-'}</InfoRow>
              <InfoRow label='รุ่น'>{cam?.model || '-'}</InfoRow>
              <InfoRow label='การทำงาน'>
                <div className='flex flex-wrap gap-1.5'>
                  {badges.map((b) => (
                    <span
                      key={b.label}
                      className='inline-flex items-center px-2.5 py-0.5 rounded-full fs-12 whitespace-nowrap'
                      style={{ border: `1px solid ${b.color}`, color: b.color }}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </InfoRow>
              <InfoRow label='สถานะ'><StatusPill online={online} /></InfoRow>
              <InfoRow label='Device'><ConnectPill online={online} /></InfoRow>
              <InfoRow label='Stream'><ConnectPill online={online} /></InfoRow>
              <InfoRow label='Downtime'>{cam?.offline_duration || '-'}</InfoRow>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(CctvMarkerInfoPanel)
