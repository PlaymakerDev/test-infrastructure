"use client"
import React, { useMemo } from 'react'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen, setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'

// ── Types ─────────────────────────────────────────────────────────────────────
// Same shape as the CCTV detail camera grid, EXCEPT each camera carries an
// incident `events` count instead of device `functions`.

type WarrantyStatus = 'in-warranty' | 'expired'

export interface CameraRow {
  id: string
  name: string
  km: string
  /** Device function tags (CCTV + analytic/counting/…) — same as CCTV detail. */
  functions: string[]
  /** Number of incidents this camera detected. */
  events: number
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

/** Event-count pill — shared by the grid card + table column. Greens up only
 *  when the camera actually has detected events; zero-count rows render in
 *  muted gray so the eye can scan the table for active cameras. */
export const EventCountTag: React.FC<{ count: number }> = ({ count }) => {
  const color = count > 0 ? '#2EE59D' : '#979797'
  return (
    <span
      className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {count} เหตุการณ์
    </span>
  )
}

const WarrantyPill: React.FC<{ warranty: WarrantyStatus }> = ({ warranty }) => {
  const cfg = warranty === 'in-warranty'
    ? { text: 'ในค้ำ', color: '#05F2DB' }
    : { text: 'หมดค้ำ', color: '#979797' }
  return (
    <span
      className='inline-flex items-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${cfg.color}`, color: cfg.color }}
    >
      {cfg.text}
    </span>
  )
}

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
      style={{ height: 160 }}
      onClick={onSelect}
    >
      <HLSLivePlayer
        cameraId={camera.id}
        hlsUrl={camera.hlsUrl}
        showLiveBadge
        enableViewportPause
        style={{ height: 160, display: 'block', pointerEvents: 'none' }}
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
      <div className='shrink-0'>
        <EventCountTag count={camera.events} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
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
        <div className='flex flex-col gap-6'>
          {groups.map((group) => (
            <div key={group.id} className='flex flex-col gap-4'>

              {/* Group header */}
              <div
                className='flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 rounded-xl'
                style={{ background: '#2a2a2a' }}
              >
                <span className='text-white font-semibold text-sm flex-1 min-w-0 wrap-break-word'>{group.label}</span>
                <div className='flex items-center gap-2 shrink-0'>
                  <TbInfoSquareRoundedFilled
                    size={18}
                    className='cursor-pointer hover:text-(--yellow)'
                    style={{ color: '#fff' }}
                    title='ดูข้อมูลโครงการ'
                    onClick={() =>
                      dispatch(
                        setProjectInfoModalOpen({
                          open: true,
                          project_id: group.projectId ?? null,
                          road_id: group.roadId ?? null,
                        })
                      )
                    }
                  />
                  <WarrantyPill warranty={group.warranty} />
                </div>
              </div>

              {/* Camera grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {group.cameras.map((cam) => (
                  <CameraCard
                    key={cam.id}
                    camera={cam}
                    onSelect={() => openCamera(cam.id)}
                  />
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default React.memo<Props>(CameraGridView)
