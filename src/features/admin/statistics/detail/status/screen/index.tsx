"use client"
import React, { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { Alert, Button, DatePicker, Empty, Spin } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/th'
import { StatusDetailProvider, useStatusDetailContext } from '../context'
import { DetailSidebar, DrawerDetailSidebar, StatusDetailTable } from '../components'
import { useLiveStatusRouteItems } from '../../../data/useLiveStatusRouteItems'
import type { RouteDetailEntry } from '../../../data/routeItems'
import { useVMSStatus } from '@/features/admin/control-vms/overall/hooks/useVMSStatus'
import { useVMSDetails } from '@/features/admin/control-vms/overall/hooks/useVMSDetails'
import { useContactDetail } from '@/hooks/queries/shared/useContactDetail'
import { ProjectInfoModal } from '@/components/modal'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

dayjs.extend(buddhistEra)
dayjs.extend(customParseFormat)
dayjs.locale('th')

const { RangePicker } = DatePicker

const WARRANTY_COLOR: Record<string, string> = {
  ในค้ำ: '#05F2DB',
  หมดค้ำ: '#979797',
  ก่อนค้ำ: '#FCD116',
}

const formatBackendBuddhistDateTime = (value: string): string => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{2}:\d{2}:\d{2})$/.exec(value.trim())
  if (!match) {
    const parsed = dayjs(value)
    return parsed.isValid() ? parsed.format('D MMM BBBB HH:mm:ss') : '-'
  }
  const [, day, month, rawYear, time] = match
  const numericYear = Number(rawYear)
  const gregorianYear = numericYear > 2400 ? numericYear - 543 : numericYear
  const normalized = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${gregorianYear} ${time}`
  const parsed = dayjs(normalized, 'DD/MM/YYYY HH:mm:ss', true)
  return parsed.isValid() ? parsed.format('D MMM BBBB HH:mm:ss') : '-'
}

const StatusDetailContent: React.FC = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const route = searchParams.get('route') || ''
  const detail = searchParams.get('detail') || ''
  const { dateRange, setDateRange } = useStatusDetailContext()
  const {
    routeItems,
    markerItems,
    isLoading: routesLoading,
    isFetching: routesFetching,
    isError: routesError,
    refetch: refetchRoutes,
  } = useLiveStatusRouteItems()

  const routeItem = routeItems.find((r) => String(r.id) === route)
  const routeName = routeItem?.name ?? route

  // Resolve the VMS strictly within the selected route. A stale or edited URL
  // must not combine one bureau's heading with another bureau's device data.
  const detailEntry: RouteDetailEntry | undefined = useMemo(() => {
    for (const s of routeItem?.sub3 ?? []) {
      const found = s.detail.find((d) => (typeof d === 'string' ? d : String(d.id)) === detail)
      if (found) return found
    }
    return undefined
  }, [routeItem, detail])

  const device = typeof detailEntry === 'object' ? detailEntry : null
  const selectedVmsId = device?.id

  const detailLabel = typeof detailEntry === 'string' || detailEntry === undefined
    ? (detailEntry ?? detail)
    : detailEntry.label
  const projectId = device?.projectId
  const roadId = device?.roadId
  const anydesk = device?.anydesk
  const desktopScreen = device?.desktopScreen
  const solutionId = device?.solutionId
  const connectionState = device?.is_online
  const statusColor = connectionState === true ? '#66AEFF' : connectionState === false ? '#E94C4C' : '#979797'

  // Real coord for the Google Map button — same pattern as alert/incident
  // detail: match the selected VMS against markerItems (one real point per
  // solution's own lat/lng).
  const coord = useMemo(
    () => markerItems.find((m) => m.routeKey === route && m.detailKey === detail)?.lngLat ?? null,
    [markerItems, route, detail],
  )

  // VMS solutions carry `project.id` (unlike the alert/lighting domain, which
  // has none). The shared hook also powers ProjectInfoModal, so opening it
  // reuses this exact cache entry.
  const { data: contactData } = useContactDetail(projectId)
  const warrantyStatus = contactData?.data?.warranty_status
  const warrantyColor = warrantyStatus ? (WARRANTY_COLOR[warrantyStatus] ?? '#05F2DB') : '#05F2DB'

  // Composite health snapshot — powers all 3 remaining stat cards
  // (operation status, Stream, Traffic Camera) from a single request.
  const statusQuery = useVMSStatus(selectedVmsId)
  const statusResponse = statusQuery.data?.data
  // Defensively reject a response that does not belong to the selected VMS.
  const status = statusResponse && String(statusResponse.vms_id) === String(selectedVmsId)
    ? statusResponse
    : undefined

  // Full solution detail — powers the right-side traffic-camera panel
  // (real HLS feed + camera name + IP, replacing the old hardcoded caption).
  const detailsQuery = useVMSDetails(solutionId)
  const detailsResponse = detailsQuery.data?.data
  // The query key already includes solutionId; this guard also prevents a
  // malformed/cached payload from flashing cameras from another device.
  const details = detailsResponse && String(detailsResponse.solution_id) === String(solutionId)
    ? detailsResponse
    : undefined
  const vmsCameras = details?.vms_camera ?? []

  const handleBack = () => {
    router.push('/admin/statistics?status')
  }

  if (routesLoading) {
    return (
      <div className="main-screen min-h-[60vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (routesError || !routeItem || !device) {
    return (
      <div className="main-screen px-4 sm:px-6 lg:px-10 flex flex-col gap-8">
        <TbArrowBigLeftFilled className="fs-24 text-(--yellow) cursor-pointer" onClick={handleBack} />
        {routesError ? (
          <Alert
            type="error"
            showIcon
            message="ไม่สามารถโหลดข้อมูลอุปกรณ์ได้"
            action={<Button size="small" onClick={refetchRoutes}>ลองใหม่</Button>}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบอุปกรณ์ตามสายทางและรหัสที่ระบุ" />
        )}
      </div>
    )
  }

  return (
    <div className="main-screen flex flex-col">
      <div className="px-3 xl:pr-3 xl:pl-0">
        <section className="flex items-start gap-3">
          <TbArrowBigLeftFilled
            className="fs-24 text-(--yellow) cursor-pointer"
            onClick={handleBack}
            style={{ marginTop: 8 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="text-(--yellow)">สายทาง {routeName || detail || '-'}</h1>
            {routesFetching && <span className="text-xs text-gray-400">กำลังอัปเดตรายการอุปกรณ์...</span>}
            <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
              <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 400 }}>
                {detailLabel || '-'}
              </p>
              <img
                src="/images/statistics/icbt.png"
                alt="ดูข้อมูลโครงการ"
                title="ดูข้อมูลโครงการ"
                width={25}
                height={25}
                onClick={() => projectId !== undefined && dispatch(setProjectInfoModalOpen({
                  open: true,
                  project_id: projectId,
                  road_id: roadId ?? null,
                }))}
                style={{ cursor: projectId !== undefined ? 'pointer' : 'default', opacity: projectId !== undefined ? 1 : 0.5 }}
              />
              {warrantyStatus && (
                <div style={{
                  height: 22, borderRadius: 88,
                  border: `1px solid ${warrantyColor}`,
                  padding: '4px 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 500, color: warrantyColor }}>
                    {warrantyStatus}
                  </span>
                </div>
              )}
              <div style={{
                height: 22, borderRadius: 88,
                border: `1px solid ${statusColor}`,
                padding: '4px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
              }}>
                {connectionState !== undefined && (
                  <img src={connectionState ? '/images/statistics/iconconnect.png' : '/images/statistics/iconnoconnect.png'} alt="" width={12} height={12} />
                )}
                <span style={{ fontSize: 10, fontWeight: 500, color: '#FFFFFF' }}>
                  {connectionState === true ? 'ออนไลน์' : connectionState === false ? 'ออฟไลน์' : '-'}
                </span>
              </div>
              <button
                type="button"
                disabled={!coord}
                onClick={() => {
                  if (!coord) return
                  window.open(`https://maps.google.com/?q=${coord[1]},${coord[0]}`, '_blank')
                }}
                style={{
                  height: 22, borderRadius: 88,
                  backgroundColor: '#003F87',
                  padding: '4px 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none',
                  cursor: coord ? 'pointer' : 'not-allowed',
                  opacity: coord ? 1 : 0.5,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 500, color: '#FFFFFF' }}>Google Map</span>
              </button>
              <button
                type="button"
                disabled={!anydesk}
                title={anydesk ? `เปิด AnyDesk : ${anydesk}` : 'ไม่มีรหัส AnyDesk'}
                onClick={() => {
                  if (!anydesk) return
                  // `anydesk:` is the desktop-app protocol handler — matches
                  // incident-detection's TitleSection. Don't `window.open` it;
                  // that races a blank tab with the protocol handler in Chrome.
                  window.location.href = `anydesk:${anydesk}`
                }}
                style={{
                  height: 22, borderRadius: 88,
                  backgroundColor: '#66AEFF',
                  padding: '4px 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                  border: 'none',
                  cursor: anydesk ? 'pointer' : 'not-allowed',
                  opacity: anydesk ? 1 : 0.5,
                }}
              >
                <img src="/images/statistics/icand.png" alt="" width={12} height={12} />
                <span style={{ fontSize: 10, fontWeight: 500, color: '#000000' }}>
                  Anydesk : {anydesk || '-'}
                </span>
              </button>
              <fieldset className="w-full sm:w-auto" style={{ flexShrink: 0, marginLeft: 'auto' }}>
                <label className='block fs-12 text-(--yellow)'>วันที่แสดงข้อมูล</label>
                <RangePicker
                  className='w-full sm:w-auto'
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
                  placeholder={['เลือกวันที่เริ่มต้น', 'เลือกวันที่สิ้นสุด']}
                  format='DD/MM/YYYY'
                  size='large'
                />
              </fieldset>
            </div>
          </div>
        </section>
      </div>
      <section className="mt-5 pr-3 relative xl:pl-98.5">
        <DetailSidebar />
        <DrawerDetailSidebar />
        <div className="flex flex-col flex-1 gap-4">
          {statusQuery.isLoading ? (
            <div className="min-h-40 flex items-center justify-center"><Spin /></div>
          ) : statusQuery.isError ? (
            <Alert
              type="error"
              showIcon
              message="ไม่สามารถโหลดสรุปสถานะ VMS ได้"
              action={<Button size="small" onClick={() => void statusQuery.refetch()}>ลองใหม่</Button>}
            />
          ) : !status ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบข้อมูลสถานะของ VMS ที่เลือก" />
          ) : (
            <Spin spinning={statusQuery.isFetching}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4" style={{ alignContent: 'start' }}>
                <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: `2px solid ${status.operation.is_online ? '#66AEFF' : '#E94C4C'}` }}>
                  <img src="/images/statistics/icc1.png" alt="" width={40} height={40} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#66AEFF', marginTop: 8 }}>สถานะการทำงานของป้าย</p>
                  <p style={{ fontSize: 32, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>{status.operation.label}</p>
                </div>
                <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: `2px solid ${status.stream.is_online ? '#4CE99A' : '#E94C4C'}` }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#4CE99A' }}>Stream</p>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 16, display: 'block' }}>
                    {status.stream.is_online ? 'Connect' : 'Disconnect'}
                  </span>
                  <p style={{ fontSize: 12, fontWeight: 400, color: '#979797' }}>ZeroTier IP : {status.zt_ip_address || '-'}</p>
                  <p style={{ fontSize: 10, fontWeight: 400, color: '#999999' }}>
                    อัพเดรตล่าสุด : {status.stream.last_connected ? formatBackendBuddhistDateTime(status.stream.last_connected) : '-'}
                  </p>
                </div>
                <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: `2px solid ${status.box.is_connected ? '#E98B4C' : '#E94C4C'}` }}>
                  <img src="/images/statistics/icc3.png" alt="" width={40} height={40} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#E98B4C', marginTop: 8 }}>Traffic Camera</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
                    {status.box.is_connected ? 'Connect' : 'Disconnect'}
                  </p>
                </div>
                <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #AFE94C' }}>
                  <img src="/images/statistics/icc5.png" alt="" width={40} height={40} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#AFE94C', marginTop: 8 }}>VMS Format</p>
                  <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Inter', color: '#FFFFFF', marginTop: 4 }}>
                    {status.last_setting?.media_type || '-'}
                  </p>
                </div>
              </div>
            </Spin>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              {desktopScreen ? (
                <HLSLivePlayer
                  key={String(selectedVmsId)}
                  cameraId={String(selectedVmsId)}
                  hlsUrl={desktopScreen}
                  enableViewportPause
                  figureClassName="rounded-xl overflow-hidden"
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีสตรีมหน้าจอของ VMS นี้" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {!solutionId ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูลชุดกล้องของ VMS นี้" />
              ) : detailsQuery.isLoading ? (
                <div className="min-h-48 flex items-center justify-center"><Spin /></div>
              ) : detailsQuery.isError ? (
                <Alert
                  type="error"
                  showIcon
                  message="ไม่สามารถโหลดข้อมูลกล้องได้"
                  action={<Button size="small" onClick={() => void detailsQuery.refetch()}>ลองใหม่</Button>}
                />
              ) : vmsCameras.length > 0 ? (
                <Swiper
                  key={String(solutionId)}
                  loop={vmsCameras.length > 1}
                  modules={[Pagination]}
                  pagination={{ clickable: true }}
                  className="w-full"
                >
                  {vmsCameras.map((item, index) => (
                    <SwiperSlide key={item.id ?? index} className="bg-transparent!">
                      <div style={{ borderRadius: 12, position: 'relative', minWidth: 0 }}>
                        <HLSLivePlayer
                          cameraId={item.camera.id}
                          hlsUrl={item.camera.hls_url}
                          enableViewportPause
                          figureClassName="rounded-xl overflow-hidden"
                        />
                        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 600, borderRadius: 8, backgroundColor: '#000000CC', padding: '8px 12px' }}>
                          <p style={{ fontSize: 12, fontWeight: 400, color: '#FFFFFF' }}>
                            {item.camera.camera_name || '-'}
                          </p>
                          <p style={{ fontSize: 12, fontWeight: 400, color: '#979797', marginTop: 2 }}>
                            IP Address : {item.camera.ip_address || '-'}
                          </p>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบกล้องที่เชื่อมกับ VMS นี้" />
              )}
            </div>
          </div>
          <StatusDetailTable key={String(device.id)} vmsId={device.id} />
        </div>
      </section>
      <ProjectInfoModal />
    </div>
  )
}

const StatusDetailScreen: React.FC = () => {
  return (
    <StatusDetailProvider>
      <StatusDetailContent />
    </StatusDetailProvider>
  )
}

export default React.memo(StatusDetailScreen)
