"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled, TbInfoCircle, TbChevronDown } from 'react-icons/tb'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { getCctvInstallDetailById, type PanelCamera } from '@/features/admin/cctv/overall/data/cctvData'
import CameraInstallTable from './CameraInstallTable'
import CctvModal, { type CctvModalCamera } from '@/components/modalcctv'

// ── Camera pin marker ─────────────────────────────────────────────────────────

const CameraPin: React.FC<{ index: number; online: boolean }> = ({ index, online }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
    <div
      style={{
        width: 28, height: 28,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        background: online ? '#ffffff' : '#E94C4C',
        boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{ transform: 'rotate(45deg)', fontSize: 10, fontWeight: 700, color: '#212121', lineHeight: 1 }}>
        {index}
      </span>
    </div>
  </div>
)

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
  id: string
}

const CctvDetail: React.FC<Props> = ({ id }) => {
  const router = useRouter()
  const detail = getCctvInstallDetailById(id)

  const [panelFilter, setPanelFilter] = useState<string>('all')
  const [modalCamera, setModalCamera] = useState<CctvModalCamera | null>(null)

  const toModal = (cam: PanelCamera): CctvModalCamera => ({
    id: cam.id,
    name: cam.name,
    hlsUrl: cam.hlsUrl,
    location: detail.location,
    functions: cam.functions ?? [],
    streamStatus: cam.online ? 'connect' : 'disconnect',
    deviceStatus: cam.online ? 'connect' : 'disconnect',
    ip: cam.ip,
  })

  const warrantyColor = detail.warrantyStatus === 'in-warranty' ? '#05F2DB' : '#979797'
  const warrantyLabel = detail.warrantyStatus === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ'

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
    <div className='main-screen px-10'>

      {/* ── Title ── */}
      <section>
        <h1 className='flex items-center gap-3' style={{ color: '#FCD116' }}>
          <button
            type='button'
            onClick={() => router.back()}
            className='cursor-pointer shrink-0'
            style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0 }}
          >
            <TbArrowBigLeftFilled size={32} style={{ color: '#FCD116' }} />
          </button>
          CCTV : {detail.title}
        </h1>

        <div className='flex items-center gap-2.5 flex-wrap mt-1 ml-11'>
          <span className='text-sm text-white'>{detail.location}</span>
          <TbInfoCircle size={15} style={{ color: '#555' }} />
          <span
            className='inline-flex items-center px-3 py-0.5 rounded-full text-xs'
            style={{ border: `1px solid ${warrantyColor}`, color: warrantyColor }}
          >
            {warrantyLabel}
          </span>
          <a
            href={detail.googleMapUrl ?? '#'}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity'
            style={{ background: '#1D4ED8', color: '#fff' }}
          >
            Google Map
          </a>
        </div>
      </section>

      {/* ── Map + camera panel ── */}
      <section
        className='relative -mx-10 mt-6 overflow-hidden'
        style={{ height: 'calc(100vh - 280px)', minHeight: 480 }}
      >
        {/* Mapbox — fills entire section */}
        <div className='absolute inset-0'>
          <BaseMap initialCenter={detail.coord} initialZoom={14} initialPitch={45} initialBearing={-10}>
            {detail.pins.map((pin, i) => (
              <HTMLMarker key={pin.id} lngLat={pin.coord} anchor='bottom'>
                <CameraPin index={i + 1} online={pin.online} />
              </HTMLMarker>
            ))}
          </BaseMap>
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
        <CameraInstallTable />
      </section>

      <CctvModal
        open={!!modalCamera}
        onClose={() => setModalCamera(null)}
        camera={modalCamera!}
      />

    </div>
  )
}

export default React.memo<Props>(CctvDetail)
