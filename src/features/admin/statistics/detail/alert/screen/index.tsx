"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbArrowBigLeftFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
import { Alert, Button, ConfigProvider, Empty, Spin } from 'antd'
import { AlertDetailProvider } from '../context'
import { AlertDetailSidebar, AlertDetailTable } from '../components'
import { useLiveAlertRouteItems } from '../../../data/useLiveAlertRouteItems'
import VoltageAmpChartsRow from '@/features/admin/traffic-lighting/detail/components/VoltageAmpChartsRow'
import { ProjectInfoModal } from '@/components/modal'
import { useAppDispatch } from '@/stores/hooks'
import { StatisticsMinimumFontSize } from '../../../overall/components/shared'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useLightingCentralList, useLightingDeviceDetails } from '@/hooks/queries/lighting'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const AlertDetailContent: React.FC = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const route = searchParams.get('route') || ''
  const detail = searchParams.get('detail') || ''
  const {
    routeItems,
    markerItems,
    isLoading: routesLoading,
    isError: routesError,
    refetch: refetchRoutes,
  } = useLiveAlertRouteItems()

  // The alert IoT-status tree intentionally contains only live health data.
  // Warranty belongs to the lighting central-list row, while phase belongs to
  // the per-device detail endpoint.  Fetch both by the selected bureau + IMEI
  // so the title badges describe this exact device (not an aggregate count).
  const lightingListQuery = useLightingCentralList(route ? Number(route) : null, undefined, 'all')
  const lightingDetailsQuery = useLightingDeviceDetails(detail)

  // Resolve the device strictly inside the selected route. This prevents a
  // stale or hand-edited `route=A&detail=device-from-B` URL from combining the
  // heading/project metadata of one bureau with another bureau's device.
  const routeItem = routeItems.find((r) => String(r.id) === route)
  const routeName = routeItem?.name ?? route
  const device = (() => {
    for (const s of routeItem?.sub3 ?? []) {
      const found = s.detail.find((d) => (typeof d === 'string' ? d : String(d.id)) === detail)
      if (found && typeof found !== 'string') return found
    }
    return null
  })()
  const detailLabel = device?.label ?? detail

  const lightingRecord = React.useMemo(() => (
    lightingListQuery.data
      ?.flatMap((bureau) => bureau.sub_department ?? [])
      .flatMap((department) => department.solutions ?? [])
      .find((solution) => String(solution.imei) === detail)
  ), [detail, lightingListQuery.data])
  // Do not infer a missing value as expired: the badge remains hidden until
  // the central-list identifies the IMEI and supplies an explicit boolean.
  const isWarranty = lightingRecord?.is_warranty
  const phase = lightingDetailsQuery.data?.phase
  // The IoT-status tree does not include a project. Its IMEI is present in
  // the lighting central-list, which provides the project id required by the
  // shared contract-detail modal.
  const projectId = lightingRecord?.project?.id ?? null
  const projectRoadId = lightingRecord?.road?.id ?? device?.roadId ?? null

  // Real coord for the Google Map button — same source/pattern as the
  // incident detail page (statistics/detail/incident): match the selected
  // device against markerItems (one real point per device geometry_point).
  const coord = markerItems.find((m) => m.routeKey === route && m.detailKey === detail)?.lngLat ?? null

  const handleBack = () => {
    router.push('/admin/statistics?alert')
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
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบอุปกรณ์ตามลิงก์ที่ระบุ" />
        )}
      </div>
    )
  }

  const connectionLabel = device.is_online === true ? 'ออนไลน์' : device.is_online === false ? 'ออฟไลน์' : '-'
  const connectionColor = device.is_online === true ? '#66AEFF' : device.is_online === false ? '#E94C4C' : '#979797'
  const healthLabel = (failed: boolean | undefined) => failed === true ? 'FAIL' : failed === false ? 'OK' : '-'
  const circuitLabel = (failed: boolean | undefined) => failed === true ? 'Disconnect' : failed === false ? 'Connect' : '-'

  return (
    <div className="main-screen px-4 sm:px-6 lg:px-10 flex flex-col statistics-font-min-14" style={{ paddingBottom: 60 }}>
      <StatisticsMinimumFontSize />
      <section className="flex items-start gap-3">
        <TbArrowBigLeftFilled
          className="fs-24 text-(--yellow) cursor-pointer"
          onClick={handleBack}
          style={{ marginTop: 8 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="text-(--yellow)">สายทาง {routeName || detail || '-'}</h1>
          <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
            <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 400 }}>
              {detailLabel || '-'}
            </p>
            <img
              src={`${BASE_PATH}/images/statistics/icbt.png`}
              alt="ดูข้อมูลโครงการ"
              title="ดูข้อมูลโครงการ"
              width={25}
              height={25}
              // The project id is resolved from central-list by matching this
              // selected device's IMEI.
              onClick={() => projectId !== null && dispatch(setProjectInfoModalOpen({
                open: true,
                project_id: projectId,
                road_id: projectRoadId,
              }))}
              style={{
                cursor: projectId !== null ? 'pointer' : 'not-allowed',
                opacity: projectId !== null ? 1 : 0.5,
              }}
            />
            {isWarranty !== undefined && (
              <span
                className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
                title={isWarranty ? 'อยู่ในระยะค้ำประกัน' : 'หมดระยะค้ำประกัน'}
                style={{
                  borderColor: isWarranty ? '#05F2DB' : '#979797',
                  color: isWarranty ? '#05F2DB' : '#979797',
                }}
              >
                {isWarranty ? 'ในค้ำ' : 'หมดค้ำ'}
              </span>
            )}
            <span
              className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
              style={{
                borderColor: connectionColor,
                color: connectionColor,
              }}
            >
              {device.is_online !== undefined && (
                device.is_online ? <TbWifi /> : <TbWifiOff />
              )}
              {connectionLabel}
            </span>
            {(phase === 1 || phase === 3) && (
              <span
                className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
                title={phase === 1 ? 'ระบบไฟฟ้า 1 เฟส' : 'ระบบไฟฟ้า 3 เฟส'}
                style={{
                  borderColor: '#FCD116',
                  color: '#FCD116',
                }}
              >
                {phase} Phase
              </span>
            )}
            <ConfigProvider theme={{ token: { colorPrimary: '#003F87', colorTextLightSolid: '#FFFFFF' } }}>
              <Button
                type="primary"
                size="middle"
                shape="round"
                className='w-full! sm:w-auto!'
                disabled={!coord}
                onClick={() => {
                  if (!coord) return
                  window.open(`https://maps.google.com/?q=${coord[1]},${coord[0]}`, '_blank')
                }}
              >
                <p className='fs-12'>Google Map</p>
              </Button>
            </ConfigProvider>
          </div>
        </div>
      </section>
      <section className="mt-6 flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
        <AlertDetailSidebar />
        <div className="flex flex-col flex-1 gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4" style={{ alignContent: 'start' }}>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #66AEFF' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#66AEFF' }}>สถานะการเชื่อมต่อ</p>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>{device.is_online === true ? 'เชื่อมต่อแล้ว' : device.is_online === false ? 'ออฟไลน์' : '-'}</span>
              <p style={{ fontSize: 11, fontWeight: 400, color: '#979797', marginTop: 6 }}>IMEI : {detail || '-'}</p>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #E98B4C' }}>
              <img src={`${BASE_PATH}/images/statistics/ct2.png`} alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#E98B4C', marginTop: 8 }}>Line Check</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>{healthLabel(device.line_check_fail)}</span>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #E9D44C' }}>
              <img src={`${BASE_PATH}/images/statistics/ct3.png`} alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#E9D44C', marginTop: 8 }}>Circuit</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>{healthLabel(device.circuit_fail)}</span>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #AFE94C' }}>
              <img src={`${BASE_PATH}/images/statistics/ct4.png`} alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#AFE94C', marginTop: 8 }}>Volt / Amp</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>{healthLabel(device.volt_amp_fail)}</span>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #4CE99A' }}>
              <img src={`${BASE_PATH}/images/statistics/ct5.png`} alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#4CE99A', marginTop: 8 }}>สถานะสาย</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>{circuitLabel(device.line_check_fail)}</span>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #4CD1E9' }}>
              <img src={`${BASE_PATH}/images/statistics/ct6.png`} alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#4CD1E9', marginTop: 8 }}>สถานะวงจร</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>{circuitLabel(device.circuit_fail)}</span>
            </div>
          </div>
          <VoltageAmpChartsRow imei={detail} />
          <AlertDetailTable imei={detail} />
        </div>
      </section>
      <ProjectInfoModal />
    </div>
  )
}

const AlertDetailScreen: React.FC = () => {
  return (
    <AlertDetailProvider>
      <AlertDetailContent />
    </AlertDetailProvider>
  )
}

export default React.memo(AlertDetailScreen)
