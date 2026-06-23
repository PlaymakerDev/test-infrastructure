"use client"
import React, { useState } from 'react'
import { TbChevronDown } from 'react-icons/tb'

import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { CctvInstallDetail, PanelCamera } from '@/features/admin/cctv/overall/data/cctvData'
import CameraInstallTable from './CameraInstallTable'
import type { InstallGroup } from './sections/CameraGridView'
import ModalLiveStreamCctv, { type CctvCameraDetail } from '@/features/admin/cctv/components/ModalLiveStreamCctv'
import CctvLocationMap from './sections/CctvLocationMap'

// ── Panel camera card — list view ─────────────────────────────────────────────

const CameraCardList: React.FC<{ camera: PanelCamera; onSelect: () => void }> = ({ camera, onSelect }) => (
  <div className='relative pl-5'>
    <div
      className='absolute left-1 top-20 w-3 h-3 rounded-full'
      style={{ background: camera.online ? '#FCD116' : '#3a3a3a', border: '2px solid #0e0e0e', zIndex: 1 }}
    />
    <div
      className='rounded-xl overflow-hidden'
      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
    >
      {/* Thumbnail */}
      <div
        style={{ height: 160, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
        onClick={onSelect}
      >
        <HLSLivePlayer
          cameraId={camera.id}
          hlsUrl={camera.hlsUrl}
          showLiveBadge={false}
          enableViewportPause
          style={{ height: 160, display: 'block', pointerEvents: 'none' }}
        />
      </div>
      {/* Info */}
      <div className='px-3 py-2 flex flex-col gap-0.5'>
        <p
          className='leading-snug line-clamp-2 cursor-pointer'
          style={{ fontSize: 11, color: camera.online ? '#66AEFF' : '#E94C4C' }}
          onClick={onSelect}
        >
          {camera.name}
        </p>
        <p style={{ fontSize: 10, color: '#6b7280' }}>IP : {camera.ip}</p>
      </div>
    </div>
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  detail: CctvInstallDetail
  /** Camera groups (one per install point on the road) — built from the
   *  central/list endpoint in the screen, shared with the search page shape. */
  groups: InstallGroup[]
}

const OverallSection: React.FC<Props> = ({ detail, groups }) => {
  const [panelFilter, setPanelFilter] = useState<string>('all')
  const [modalCamera, setModalCamera] = useState<CctvCameraDetail | null>(null)

  const toModal = (cam: PanelCamera): CctvCameraDetail => ({
    id: cam.id,
    name: cam.name,
    hlsUrl: cam.hlsUrl,
    location: detail.location,
    functions: cam.functions ?? [],
    streamStatus: cam.online ? 'connect' : 'disconnect',
    deviceStatus: cam.online ? 'connect' : 'disconnect',
    ip: cam.ip,
  })

  const displayedCameras = panelFilter === 'online'
    ? detail.cameras.filter((c) => c.online)
    : panelFilter === 'offline'
      ? detail.cameras.filter((c) => !c.online)
      : detail.cameras

  const filterOptions = [
    { value: 'all', label: `กล้อง CCTV ทั้งหมด (${detail.totalCameras} รายการ)` },
    { value: 'online', label: `ออนไลน์ (${detail.onlineCameras} รายการ)` },
    { value: 'offline', label: `ออฟไลน์ (${detail.offlineCameras} รายการ)` },
  ]

  return (
    <>
      {/* ── Map + camera panel ── */}
      <section
        className='relative -mx-10 mt-6 overflow-hidden'
        style={{ height: 'calc(100vh - 280px)', minHeight: 480 }}
      >
        {/* Mapbox — fills entire section */}
        <div className='absolute inset-0'>
          <CctvLocationMap
            cameras={detail.cameras}
            center={detail.coord}
            onSelectCamera={(cam) => setModalCamera(toModal(cam))}
            edgeFade={{ left: 30, right: 30, top: 10, bottom: 10 }}
          />
        </div>

        {/* ── Right camera panel ── */}
        <aside
          className='absolute z-10 top-3 bottom-3 right-3 flex flex-col rounded-2xl overflow-hidden'
          style={{ width: 370, background: '#151515' }}
        >
          {/* Dropdown */}
          <div className='p-3 shrink-0'>
            <div className='relative' style={{ border: '1px solid #FCD116', borderRadius: 8, background: '#1a1a1a' }}>
              <select
                value={panelFilter}
                onChange={(e) => setPanelFilter(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  padding: '9px 36px 9px 12px',
                  fontSize: 13,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                }}
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: '#1a1a1a', color: '#fff' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none'>
                <TbChevronDown size={16} style={{ color: '#FCD116' }} />
              </div>
            </div>
          </div>

          {/* Scrollable camera list */}
          <div className='flex-1 overflow-y-auto no-scrollbar'>
            <div className='flex flex-col gap-3 p-3'>
              {displayedCameras.map((cam) => (
                <CameraCardList key={cam.id} camera={cam} onSelect={() => setModalCamera(toModal(cam))} />
              ))}
            </div>
          </div>

        </aside>
      </section>

      {/* ── Camera table ── */}
      <section className='mt-8'>
        <CameraInstallTable groups={groups} />
      </section>

      <ModalLiveStreamCctv
        open={!!modalCamera}
        onClose={() => setModalCamera(null)}
        camera={modalCamera}
      />

    </>
  )
}

export default React.memo<Props>(OverallSection)
