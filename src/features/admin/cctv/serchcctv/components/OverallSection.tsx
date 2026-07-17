"use client"
import React, { useMemo, useState } from 'react'
import { Select } from 'antd'
import { TbSearch, TbRoad, TbVideo, TbList } from 'react-icons/tb'
import CameraDetailTableCctv from './sections/overall/CameraDetailTableCctv'
import CctvLocationMap from '@/features/admin/cctv/detail/components/sections/CctvLocationMap'
import type { PanelCamera } from '@/features/admin/cctv/overall/data/cctvData'
import type { InstallGroup, CameraRow } from './sections/overall/CameraGridView'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useCctvCameraCentralList, useCctvOverviewCentralList } from '@/hooks/queries/cctv'
import { extractCameraFunctions } from '@/features/admin/cctv/components/cameraFunctions'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {
  deptId?: string | null
}

// ── Pill badge ────────────────────────────────────────────────────────────────

const Pill: React.FC<{ count: number; label: string; color: string }> = ({ count, label, color }) => (
  <span
    className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    <span className='font-semibold'>{count.toLocaleString()}</span>
    <span>{label}</span>
  </span>
)

// ── Info card ─────────────────────────────────────────────────────────────────

const InfoCard: React.FC<{
  icon: React.ReactNode
  label: string
  accentColor?: string
  children: React.ReactNode
}> = ({ icon, label, accentColor = '#2a2a2a', children }) => (
  <div
    className='flex flex-col gap-3 rounded-2xl p-4'
    style={{ background: '#1a1a1a', border: `1px solid ${accentColor}` }}
  >
    <div className='flex items-center gap-2'>
      <span style={{ color: accentColor === '#2a2a2a' ? '#666' : accentColor }}>{icon}</span>
      <span className='text-sm font-medium text-white/60'>{label}</span>
    </div>
    {children}
  </div>
)

const OverallSection: React.FC<Props> = ({ deptId }) => {
  const dispatch = useAppDispatch()
  const openCamera = (id: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: id }))
  // `selectedRoad` (id + label) drives the camera central list.
  const [selectedRoad, setSelectedRoad] = useState<{ id: number; label: string } | null>(null)

  // Dropdown lists ONLY roads that actually have CCTV — sourced from the same
  // overview the overall page uses. (NOT /manage/roads, which returns every
  // road the department administers; most have no camera, so picking one would
  // show an empty result.) Cache is shared with the overall page.
  const { data: centralRoads, isLoading: roadsLoading } = useCctvOverviewCentralList(deptId)

  // Distinct (road_id → road_code) across every CCTV solution. road_code is
  // unique within a department, so it alone labels the option.
  const roadOptions = useMemo(() => {
    const map = new Map<number, string>()
    for (const bureau of centralRoads ?? []) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          map.set(sol.road.id, sol.road.code_name)
        }
      }
    }
    return Array.from(map, ([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'th'))
  }, [centralRoads])

  // Effective road = the user's explicit pick, else the first CCTV road so the
  // page shows cameras by default (no empty state). Derived, not effect-driven.
  const effectiveRoad = useMemo(() => {
    if (selectedRoad) return selectedRoad
    const first = roadOptions[0]
    return first ? { id: first.value, label: first.label } : null
  }, [selectedRoad, roadOptions])

  const { data: central } = useCctvCameraCentralList(effectiveRoad?.id)

  const lists = useMemo(() => central?.lists ?? [], [central?.lists])
  const meta = central?.metadata

  // Group cameras by install point (solution_location) for the table layout.
  const groups = useMemo<InstallGroup[]>(
    () =>
      lists.map((item) => ({
        id: String(item.solution_location_id),
        // Group label = solution name + install-point name.
        label: [item.solution_name, item.solution_location_name].filter(Boolean).join(' '),
        warranty: item.project.is_warranty ? 'in-warranty' : 'expired',
        projectId: item.project.project_id,
        roadId: effectiveRoad?.id,
        cameras: item.cameras.map<CameraRow>((c) => ({
          id: c.id,
          name: c.camera_name,
          km: c.sta,
          functions: extractCameraFunctions(c),
          ip: c.ip_address,
          hlsUrl: c.hls_url,
          streamStatus: c.is_online ? 'connect' : 'disconnect',
          deviceStatus: c.is_online ? 'connect' : 'disconnect',
        })),
      })),
    [lists, effectiveRoad?.id]
  )

  // Flatten cameras with coords into the same `PanelCamera` shape the detail
  // page uses — lets us share `CctvLocationMap` for the marker grouping,
  // popup-on-overlap, and HLS thumbnail logic.
  const mapCameras = useMemo<PanelCamera[]>(
    () =>
      lists
        .flatMap((item) => item.cameras)
        .filter((c) => c.geometry_point)
        .map<PanelCamera>((c) => ({
          id: c.id,
          name: c.camera_name,
          ip: c.ip_address,
          online: c.is_online,
          km: c.sta,
          hlsUrl: c.hls_url,
          functions: extractCameraFunctions(c),
          coord: c.geometry_point as [number, number],
        })),
    [lists]
  )

  // Map centre = first camera with a coord on the selected road, else a sane
  // fallback (Bangkok); CctvLocationMap also frames all markers via fitBounds.
  const mapCenter: [number, number] =
    mapCameras[0]?.coord ?? [100.5018, 13.7563]

  const cameraTotal = (meta?.camera_online_count ?? 0) + (meta?.camera_offline_count ?? 0)

  return (
    <>
      {/* ── Map + search overlay ── */}
      <section
        className='relative -mx-10 mt-6 overflow-hidden'
        style={{ height: 'calc(100vh - 220px)', minHeight: 480 }}
      >
        {/* Mapbox — fills entire section. Reuses the same map the detail page
          * uses so behaviour is consistent: cameras sharing a coordinate merge
          * into one pin with a count badge + popup picker; clicking a pin opens
          * the central Live Stream modal (via Redux). */}
        <div className='absolute inset-0'>
          <CctvLocationMap
            cameras={mapCameras}
            center={mapCenter}
            onSelectCamera={(cam) => openCamera(cam.id)}
            edgeFade={{ left: 30, right: 30, top: 10, bottom: 10 }}
          />
        </div>

        {/* Right overlay — search + info cards. Wrapped in MapOverlayPanel so
          * the navbar's "เน้นแผนที่" toggle slides it off-screen and leaves
          * the map alone (same behaviour as every other map page). */}
        <MapOverlayPanel
          position='right'
          className='absolute z-10 top-5 right-5 flex flex-col gap-3 pointer-events-auto'
          style={{ width: 320 }}
        >
          {/* Road search (autocomplete from /manage/roads) */}
          <div
            className='flex items-center gap-2 px-3 py-1.5 rounded-2xl'
            style={{ background: '#1a1a1a', border: '1px solid #333' }}
          >
            <TbSearch size={18} style={{ color: '#666', flexShrink: 0 }} />
            <Select
              showSearch
              allowClear
              value={effectiveRoad?.id}
              onChange={(value, option) => {
                if (!value) {
                  setSelectedRoad(null)
                  return
                }
                const label = Array.isArray(option) ? '' : (option?.label as string) ?? ''
                setSelectedRoad({ id: Number(value), label })
              }}
              options={roadOptions}
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              loading={roadsLoading}
              notFoundContent={roadsLoading ? 'กำลังโหลด...' : 'ไม่พบสายทางที่มีกล้อง'}
              placeholder='ค้นหาสายทาง เช่น ลป.1003...'
              variant='borderless'
              className='flex-1'
              style={{ width: '100%' }}
            />
          </div>

          {/* Card 1 — สายทาง */}
          <InfoCard icon={<TbRoad size={18} />} label='สายทาง' accentColor='#FCD116'>
            <div className='flex flex-col gap-0.5'>
              <span className='text-lg font-bold text-white'>
                {effectiveRoad ? effectiveRoad.label : 'เลือกสายทาง'}
              </span>
              <span className='text-xs' style={{ color: '#aaa' }}>
                {effectiveRoad
                  ? `${meta?.project_count ?? 0} โครงการ, กล้อง CCTV ${cameraTotal.toLocaleString()} ตัว`
                  : 'ค้นหาและเลือกสายทางเพื่อแสดงกล้อง'}
              </span>
            </div>
          </InfoCard>

          {/* Card 2 — สถานะกล้อง */}
          <InfoCard icon={<TbVideo size={18} />} label='สถานะกล้อง'>
            <div className='flex flex-wrap gap-2'>
              <Pill count={cameraTotal} label='ทั้งหมด' color='#fff' />
              <Pill count={meta?.camera_online_count ?? 0} label='ออนไลน์' color='#66AEFF' />
              <Pill count={meta?.camera_offline_count ?? 0} label='ออฟไลน์' color='#E94C4C' />
            </div>
          </InfoCard>

          {/* Card 3 — โครงการทั้งหมด */}
          <InfoCard icon={<TbList size={18} />} label='โครงการทั้งหมด'>
            <div className='flex flex-wrap gap-2'>
              <Pill count={meta?.project_count ?? 0} label='ทั้งหมด' color='#fff' />
              <Pill count={meta?.in_warranty_count ?? 0} label='ในค้ำ' color='#05F2DB' />
              <Pill count={meta?.out_warranty_count ?? 0} label='หมดค้ำ' color='#979797' />
            </div>
          </InfoCard>
        </MapOverlayPanel>
      </section>

      {/* ── Camera detail table — hidden in map-focus mode too ── */}
      <MapOverlayPanel position='bottom' className='mt-8'>
        <CameraDetailTableCctv groups={groups} />
      </MapOverlayPanel>
    </>
  )
}

export default React.memo<Props>(OverallSection)
