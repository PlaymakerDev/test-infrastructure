"use client"
import React, { useState } from 'react'
import { Button, Select } from 'antd'
import { TbChevronDown, TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb'

import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { CctvInstallDetail, PanelCamera } from '@/features/admin/cctv/overall/data/cctvData'
import CameraInstallTable from './CameraInstallTable'
import type { InstallGroup } from './sections/CameraGridView'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import CctvDetailMap, { type CamGroup } from './sections/CctvDetailMap'
import CctvMarkerInfoPanel from './sections/CctvMarkerInfoPanel'
import useMapFocusMode from '@/utils/hooks/useMapFocusMode'

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
  const dispatch = useAppDispatch()
  const [panelFilter, setPanelFilter] = useState<string>('all')
  // A clicked map pin (its camera group). When set, the right rail shows that
  // pin's camera info (dropdown to switch among cameras at the same coordinate)
  // instead of the full list; clicking the pin again clears it + zooms out.
  const [selected, setSelected] = useState<CamGroup | null>(null)
  // Collapse/expand the right panel (mirrors control-vms) to free up the map.
  const [panelOpen, setPanelOpen] = useState(true)
  // Global Map Focus Mode also force-hides the panel + its collapse button.
  const { isMapFocus } = useMapFocusMode()
  const railHidden = !panelOpen || isMapFocus
  const openCamera = (id: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: id }))

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
          <CctvDetailMap
            cameras={detail.cameras}
            center={detail.coord}
            selectedKey={selected?.key ?? null}
            onToggleGroup={setSelected}
            edgeFade={{ left: 30, right: 30, top: 10, bottom: 10 }}
          />
        </div>

        {/* ── Right camera panel ── */}
        <aside
          className={`absolute z-10 top-3 bottom-3 right-3 flex flex-col rounded-2xl overflow-hidden transition-transform duration-300 ease-in-out ${railHidden ? 'translate-x-[calc(100%+0.75rem)]' : ''}`}
          style={{ width: 370, background: '#151515' }}
          aria-hidden={railHidden || undefined}
        >
          {selected ? (
            <CctvMarkerInfoPanel cameras={selected.cameras} onClose={() => setSelected(null)} onOpenLive={openCamera} />
          ) : (
            <>
          {/* Dropdown — antd Select so the popup matches the trigger width and
            * long labels wrap to 2 lines instead of overflowing the screen. */}
          <div className='p-3 shrink-0'>
            <div style={{ border: '1px solid #FCD116', borderRadius: 8, background: '#1a1a1a' }}>
              <Select
                value={panelFilter}
                onChange={(v) => setPanelFilter(v)}
                variant='borderless'
                className='cctv-cam-select w-full'
                classNames={{ popup: { root: 'cctv-cam-dropdown' } }}
                suffixIcon={<TbChevronDown size={16} style={{ color: '#FCD116' }} />}
                options={filterOptions}
                optionRender={(opt) => <span className='cctv-cam-option'>{opt.label}</span>}
              />
            </div>
          </div>

          {/* Scrollable camera list */}
          <div className='flex-1 overflow-y-auto no-scrollbar'>
            <div className='flex flex-col gap-3 p-3'>
              {displayedCameras.map((cam) => (
                <CameraCardList key={cam.id} camera={cam} onSelect={() => openCamera(cam.id)} />
              ))}
            </div>
          </div>
            </>
          )}
        </aside>

        {/* Collapse / expand the right panel (same pattern as control-vms) so
          * the map can use the full width. Hidden while Map Focus Mode is
          * on, since the panel is force-hidden globally by the navbar. */}
        {!isMapFocus && (
          <Button
            type='primary'
            shape='circle'
            title={panelOpen ? 'ซ่อนแผงข้อมูล' : 'แสดงแผงข้อมูล'}
            icon={panelOpen ? <TbLayoutSidebarLeftCollapse className='fs-18' /> : <TbLayoutSidebarLeftExpand className='fs-18' />}
            onClick={() => setPanelOpen((v) => !v)}
            className='absolute! z-20 top-6 w-10! h-10! shadow-lg'
            style={{ right: panelOpen ? 374 : 12, transition: 'right 0.3s ease' }}
          />
        )}
      </section>

      {/* ── Camera table ── */}
      <section className='mt-8'>
        <CameraInstallTable groups={groups} />
      </section>
    </>
  )
}

export default React.memo<Props>(OverallSection)
