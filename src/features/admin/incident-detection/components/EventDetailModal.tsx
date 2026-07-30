"use client"
import React, { useMemo } from 'react'
import { ConfigProvider, Modal } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  TbCalendar,
  TbCamera,
  TbCarCrash,
  TbHierarchy3,
  TbId,
  TbMapPin,
  TbPhotoOff,
  TbScan,
  TbWorld,
} from 'react-icons/tb'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { WhiteTeardropPin } from '@/components/map/markers/OverlapMarkers'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { getDepartmentByRoadAPI } from '@/services/routes/SharedService'
import {
  getEventTypeColor,
  getEventTypeLabel,
} from '@/features/admin/incident-detection/components/eventTypes'
import { useIncidentCameraList } from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'
import type { IncidentTransactionItem } from '@/types/incident-detection/details-api'
import { DEVICE_BADGE } from '@/constants'

interface Props {
  open: boolean
  event: IncidentTransactionItem | null
  /** Road code of the current solution (e.g. "ชม.3028") — not in the event row.
   *  Passed in from the parent which already has it from central/list. */
  roadCode?: string
  onClose: () => void
}

const fmtThaiDateTime = (iso: string): string => {
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  return `${d.date()} ${months[d.month()]} ${d.year() + 543} ${d.format('HH:mm:ss')}`
}

/** Outlined pill — used by ประเภทเหตุการณ์ / การทำงาน / Stream / Device. */
const Pill: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span
    className='inline-flex items-center px-3 py-0.5 rounded-full fs-12 whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {children}
  </span>
)

/** Center-aligned info cell — icon + label stacked above the value, all
 *  centered. Matches the Figma layout for "ข้อมูลเหตุการณ์". */
const InfoCell: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <div className='flex flex-col items-center text-center gap-1.5'>
    <span className='fs-22 text-white'>{icon}</span>
    <span className='fs-12 text-gray-400'>{label}</span>
    <div className='fs-13 text-white'>{children}</div>
  </div>
)

const EventDetailModal: React.FC<Props> = ({ open, event, roadCode, onClose }) => {
  const deptId = useDeptId()
  // Department lookup for "แขวง" sub-line. Same source as ProjectInfoModal.
  const { data: dept } = useQuery({
    queryKey: ['department_by_road', event?.camera.road_id],
    queryFn: () => getDepartmentByRoadAPI({ road_id: event!.camera.road_id }).then((r) => r.data.department_name),
    enabled: open && !!event?.camera.road_id,
  })

  // Live camera status (online/offline) — looked up by camera.id from
  // /cameras/list. Same cache key as DataDisplaySection on this page.
  const { data: cameraList } = useIncidentCameraList(deptId, {
    solution_id: event?.camera.solution_id,
    page: 1,
    limit: 100,
  })
  const cameraStatus = useMemo(() => {
    if (!event || !cameraList) return null
    const row = cameraList.res_data.find((r) => r.camera.id === event.camera.id)
    return row?.camera.status ?? null
  }, [event, cameraList])

  const coord = event?.camera.point_geometry ?? null

  const installPoint = useMemo(() => {
    if (!event) return '-'
    const sta = event.camera.sta || '-'
    return roadCode ? `${roadCode} กม.${sta}` : `กม.${sta}`
  }, [event, roadCode])

  const typeLabel = event ? getEventTypeLabel(event.analytic_type_info.id, event.analytic_type_info.analytic_type_name_th) : '-'
  const typeColor = event ? getEventTypeColor(event.analytic_type_info.id) : '#9ca3af'

  // Prefer real-time `is_online`; fall back to `hls_url` presence (handles
  // "Analytic :"-prefixed solutions where cameras/list returns empty).
  const isOnline = cameraStatus?.is_online ?? !!event?.camera.hls_url
  const statusColor = isOnline ? '#66AEFF' : '#E94C4C'

  const titleNode = (
    <div className='flex items-center gap-2'>
      <TbCarCrash className='fs-22' style={{ color: '#ffffff' }} />
      <span className='fs-18 font-semibold' style={{ color: '#ffffff' }}>
        รายละเอียดเหตุการณ์
      </span>
    </div>
  )

  return (
    <ConfigProvider theme={{ components: { Modal: { colorIcon: '#FFFFFF', borderRadiusLG: 20 } } }}>
      <Modal
        title={titleNode}
        open={open}
        onOk={onClose}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        centered
        width={1100}
        classNames={{ container: 'border-2! border-(--default-blue)!' }}
      >
        {/* Camera name subtitle — blue to match Figma. */}
        <p className='fs-12 mb-4 wrap-break-word' style={{ color: '#66AEFF' }}>
          {event?.camera.camera_name || '-'}
        </p>

        {/* Media strip — left: event VIDEO (video_path), right: event SNAPSHOT
          * (image_path). Both 16:9 to keep the row visually balanced. */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-5'>
          <div className='rounded-lg overflow-hidden bg-[#0e0e0e]' style={{ aspectRatio: '16 / 9' }}>
            {event?.video_path ? (
              <video
                key={event.id}
                src={event.video_path}
                poster={event.image_path || undefined}
                controls
                autoPlay
                loop
                // `muted` is required for browser autoplay policies — user can
                // unmute via the controls. Without it autoPlay is blocked.
                muted
                playsInline
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full flex flex-col items-center justify-center gap-1 text-gray-500'>
                <TbPhotoOff size={28} />
                <span className='fs-12'>ไม่มีวิดิโอเหตุการณ์</span>
              </div>
            )}
          </div>
          <div className='rounded-lg overflow-hidden bg-[#0e0e0e]' style={{ aspectRatio: '16 / 9' }}>
            {event?.image_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.image_path} alt='event snapshot' className='w-full h-full object-cover' />
            ) : (
              <div className='w-full h-full flex flex-col items-center justify-center gap-1 text-gray-500'>
                <TbPhotoOff size={28} />
                <span className='fs-12'>ไม่มีภาพเหตุการณ์</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Info grid ─────────────────────────────────────────────────────
          * Left: 7 center-aligned cells in a 3-col grid (last row partial).
          * Right: map with clickable marker + Google Map button + install card. */}
        <h4 className='mb-4' style={{ color: '#66AEFF' }}>ข้อมูลเหตุการณ์</h4>
        {/* 6/6 split so the map (right half) lines up with the right event
          * image above (also 50%). */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6'>
            <InfoCell icon={<TbMapPin />} label='จุดติดตั้ง'>
              {installPoint}
            </InfoCell>
            <InfoCell icon={<TbCarCrash />} label='ประเภทเหตุการณ์'>
              <Pill color={typeColor}>{typeLabel}</Pill>
            </InfoCell>
            <InfoCell icon={<TbCalendar />} label='วันที่และเวลาเกิดเหตุการณ์'>
              {event ? fmtThaiDateTime(event.date_time) : '-'}
            </InfoCell>
            <InfoCell icon={<TbHierarchy3 />} label='การทำงาน'>
              <Pill color={DEVICE_BADGE.analytic.color}>{DEVICE_BADGE.analytic.label}</Pill>
            </InfoCell>
            <InfoCell icon={<TbId />} label='IP Address'>
              {event?.camera.ip_address || '-'}
            </InfoCell>
            <span />{/* fill the row */}
            <InfoCell icon={<TbScan />} label='Stream Status'>
              <Pill color={statusColor}>{isOnline ? 'Connect' : 'Disconnect'}</Pill>
            </InfoCell>
            <InfoCell icon={<TbCamera />} label='Device Status'>
              <Pill color={statusColor}>{isOnline ? 'Connect' : 'Disconnect'}</Pill>
            </InfoCell>
          </div>

          {/* Map column — fixed height, marker click → popup like Tab1 map. */}
          <div className='relative rounded-lg overflow-hidden' style={{ height: 360 }}>
            {coord && event ? (
              <BaseMap
                initialCenter={coord}
                initialZoom={16}
                initialPitch={50}
                initialBearing={-12}
              >
                <HTMLMarker
                  lngLat={coord}
                  anchor='bottom'
                  title={event.camera.camera_name}
                  popup={() => (
                    <div
                      style={{
                        // Compact width so the popup fits above the marker
                        // without overlapping the install-point card at the
                        // bottom of the map column.
                        width: 210,
                        background: 'rgba(14,14,14,0.97)',
                        border: '1px solid #2f6db0',
                        borderRadius: 10,
                        padding: 8,
                      }}
                    >
                      <HLSLivePlayer
                        cameraId={event.camera.id}
                        hlsUrl={event.camera.hls_url}
                        showLiveBadge
                        enableViewportPause
                        figureClassName='h-32 min-h-0 max-h-none w-full mb-1.5 rounded-md overflow-hidden'
                      />
                      <p className='fs-12' style={{ color: '#66AEFF', fontWeight: 600, lineHeight: 1.3, margin: '0 0 3px', wordBreak: 'break-all' }}>
                        {event.camera.camera_name}
                      </p>
                      <p className='fs-12' style={{ color: '#9ca3af', margin: 0 }}>
                        IP : {event.camera.ip_address}
                      </p>
                    </div>
                  )}
                  popupOptions={{ offset: 18, closeButton: true, maxWidth: '230px' }}
                >
                  <WhiteTeardropPin />
                </HTMLMarker>
              </BaseMap>
            ) : (
              <div className='absolute inset-0 flex items-center justify-center text-gray-500 fs-12 bg-[#0e0e0e]'>
                ไม่มีพิกัดกล้อง
              </div>
            )}

            {/* Google Map button (top-right overlay). */}
            {coord && (
              <button
                type='button'
                className='absolute top-3 right-3 rounded-full px-4 py-1 fs-12 font-medium cursor-pointer'
                style={{ background: '#003F87', color: '#fff' }}
                onClick={() =>
                  window.open(`https://maps.google.com/?q=${coord[1]},${coord[0]}`, '_blank')
                }
              >
                Google Map
              </button>
            )}

            {/* Install point card (bottom overlay). */}
            <div
              className='absolute left-3 right-3 bottom-3 rounded-lg p-3 backdrop-blur-sm'
              style={{ background: 'rgba(14,14,14,0.85)', border: '1px solid #2a2a2a' }}
            >
              <p className='fs-12 mb-1 flex items-center gap-1.5' style={{ color: '#FCD116' }}>
                <TbMapPin /> จุดติดตั้งกล้อง
              </p>
              <p className='fs-12 text-white mb-0'>
                {installPoint}
                {dept && (
                  <>
                    <span className='text-gray-500 mx-1.5'>·</span>
                    <span className='text-gray-300'>{dept}</span>
                  </>
                )}
              </p>
              {coord && (
                <p className='fs-12 text-gray-400 mb-0 mt-1 flex items-center gap-1'>
                  <TbWorld size={12} /> {coord[1].toFixed(4)}° N, {coord[0].toFixed(4)}° E
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(EventDetailModal)
