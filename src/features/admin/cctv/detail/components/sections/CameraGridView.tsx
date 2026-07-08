"use client"
import React, { useMemo } from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { CameraFunctionTag } from '@/features/admin/cctv/components/cameraFunctions'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'

// ── Types ─────────────────────────────────────────────────────────────────────

type WarrantyStatus = 'in-warranty' | 'expired'

export interface CameraRow {
  id: string
  name: string
  km: string
  /** Real function tags from the API (CCTV + counting/analytic/traffic/…). */
  functions: string[]
  ip: string
  streamStatus: 'connect' | 'disconnect'
  deviceStatus: 'connect' | 'disconnect'
  hlsUrl?: string
}

export interface InstallGroup {
  id: string
  label: string
  warranty: WarrantyStatus
  cameras: CameraRow[]
  /** Contract/road ids — power the central Project Info modal on the ⓘ icon. */
  projectId?: number
  roadId?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseKm = (km: string): number => {
  const [main, sub] = km.split('+')
  return (parseInt(main ?? '0', 10) * 1000) + parseInt(sub ?? '0', 10)
}

// ── Sub-components ────────────────────────────────────────────────────────────

// ── Camera card ───────────────────────────────────────────────────────────────

interface CardProps {
  camera: CameraRow
  showKm?: boolean
  onSelect: () => void
}

const CameraCard: React.FC<CardProps> = ({ camera, showKm, onSelect }) => (
  <div
    className='flex flex-col gap-3 rounded-2xl p-3'
    style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
  >
    <div
      className='rounded-xl overflow-hidden cursor-pointer'
      onClick={onSelect}
    >
      {/* 16:9 aspect box (matches Incident / traffic-volume grids). */}
      <HLSLivePlayer
        figureClassName='aspect-video rounded-xl'
        cameraId={camera.id}
        hlsUrl={camera.hlsUrl}
        showLiveBadge
        enableViewportPause
        style={{ pointerEvents: 'none' }}
      />
    </div>

    {showKm && (
      <span className='text-xs font-semibold' style={{ color: '#FCD116' }}>
        กม. {camera.km}
      </span>
    )}

    <p
      className='fs-12 font-normal leading-snug line-clamp-2 cursor-pointer hover:underline'
      style={{ color: '#66AEFF' }}
      title={camera.name}
      onClick={onSelect}
    >
      {camera.name}
    </p>

    <div className='flex items-center justify-between gap-2 min-w-0'>
      <span className='text-xs min-w-0 truncate' style={{ color: '#888' }}>
        IP : {camera.ip}
      </span>
      <div className='flex items-center gap-1 flex-wrap justify-end shrink-0'>
        {camera.functions.map((fn) => <CameraFunctionTag key={fn} tag={fn} />)}
      </div>
    </div>
  </div>
)

// ── Grid view ─────────────────────────────────────────────────────────────────

export type GridMode = 'project' | 'km'

interface Props {
  groups: InstallGroup[]
  mode?: GridMode
}

const CameraGridView: React.FC<Props> = ({ groups, mode = 'project' }) => {
  const dispatch = useAppDispatch()
  const openCamera = (id: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: id }))

  const kmSorted = useMemo(() => {
    if (mode !== 'km') return []
    return groups
      .flatMap((g) => g.cameras)
      .slice()
      .sort((a, b) => parseKm(a.km) - parseKm(b.km))
  }, [groups, mode])

  return (
    <>
      {mode === 'km' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
          {kmSorted.map((cam) => (
            <CameraCard
              key={cam.id}
              camera={cam}
              showKm
              onSelect={() => openCamera(cam.id)}
            />
          ))}
        </div>
      ) : (
        // Flat grid (no per-install-point header) — matches the Incident /
        // traffic-volume detail layout: ~4 cards per row on desktop, responsive.
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
          {groups.flatMap((g) => g.cameras).map((cam) => (
            <CameraCard
              key={cam.id}
              camera={cam}
              onSelect={() => openCamera(cam.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default React.memo<Props>(CameraGridView)
