"use client"
import React, { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { Button, DatePicker, Empty, Spin } from 'antd'
import dayjs from 'dayjs'
import { IncidentDetailProvider, useIncidentDetailContext } from '../context'
import { IncidentDetailSidebar, IncidentDetailTable, IncidentDonutSection } from '../components'
import { ProjectInfoModal } from '@/components/modal'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useLiveIncidentRouteItems } from '../../../data/useLiveIncidentRouteItems'
import type { RouteDetailEntry } from '../../../data/routeItems'
import EventTrendSection from '@/features/admin/incident-detection/detail/components/sections/overall/EventTrendSection'
import { StatisticsMinimumFontSize } from '../../../overall/components/shared'

const { RangePicker } = DatePicker

const IncidentDetailContent: React.FC = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const route = searchParams.get('route') || ''
  const detail = searchParams.get('detail') || ''
  const { dateRange, setDateRange } = useIncidentDetailContext()
  const {
    routeItems,
    markerItems,
    isLoading: routesLoading,
    isError: routesError,
    refetch: refetchRoutes,
  } = useLiveIncidentRouteItems()

  const startDate = dateRange?.[0]?.format('YYYY-MM-DD')
  const endDate = dateRange?.[1]?.format('YYYY-MM-DD')

  // Resolve the solution strictly inside the selected route. A hand-edited or
  // stale URL must not combine one bureau's heading/project with another
  // bureau's globally matched solution.
  const routeItem = routeItems.find((r) => String(r.id) === route)
  const routeName = routeItem?.name ?? route
  const detailEntry: RouteDetailEntry | undefined = useMemo(() => {
    for (const subDepartment of routeItem?.sub3 ?? []) {
      const found = subDepartment.detail.find(
        (entry) => (typeof entry === 'string' ? entry : String(entry.id)) === detail
      )
      if (found) return found
    }
    return undefined
  }, [routeItem, detail])
  const detailLabel = typeof detailEntry === 'string' || detailEntry === undefined
    ? (detailEntry ?? detail)
    : detailEntry.label
  const projectId = typeof detailEntry === 'object' ? detailEntry.projectId : undefined
  const roadId = typeof detailEntry === 'object' ? detailEntry.roadId : undefined
  const isOnline = typeof detailEntry === 'object' ? detailEntry.is_online !== false : true
  const statusColor = isOnline ? '#66AEFF' : '#E94C4C'
  // Only render the warranty pill when the backend actually reported
  // `is_warranty` for THIS solution (mock/undefined data → no pill at all,
  // instead of a misleading default "ในค้ำ").
  const warranty = typeof detailEntry === 'object' && detailEntry.is_warranty !== undefined
    ? detailEntry.is_warranty
    : null
  const warrantyColor = warranty === false ? '#979797' : '#05F2DB'
  const warrantyLabel = warranty === false ? 'หมดค้ำ' : 'ในค้ำ'

  // Real coord for the Google Map button — same source as the sidebar/overview
  // map (the central-list call already cached by useLiveIncidentRouteItems),
  // so no extra request. Match the solution in ?detail= against markerItems.
  const coord = useMemo(
    () => markerItems.find((m) => m.routeKey === route && m.detailKey === detail)?.lngLat ?? null,
    [markerItems, route, detail]
  )
  const roadCode = typeof detailEntry === 'object'
    ? detailEntry.label.split(' - ')[0]
    : undefined

  const handleBack = () => {
    router.push('/admin/statistics?incident')
  }

  if (routesLoading) {
    return (
      <div className="main-screen min-h-[60vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (routesError || !routeItem || !detailEntry) {
    return (
      <div className="main-screen px-4 sm:px-6 lg:px-10 flex flex-col gap-8">
        <TbArrowBigLeftFilled className="fs-24 text-(--yellow) cursor-pointer" onClick={handleBack} />
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={routesError ? 'ไม่สามารถโหลดข้อมูลสายทางได้' : 'ไม่พบจุดติดตั้งในสายทางตามลิงก์ที่ระบุ'}
        >
          {routesError && <Button onClick={() => refetchRoutes()}>ลองใหม่</Button>}
        </Empty>
      </div>
    )
  }

  return (
    <div className="main-screen px-4 sm:px-6 lg:px-10 flex flex-col statistics-font-min-14">
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
              src="/atlas/images/statistics/icbt.png"
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
            {warranty !== null && (
              <div style={{
                height: 22, borderRadius: 88,
                border: `1px solid ${warrantyColor}`,
                padding: '4px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: warrantyColor }}>{warrantyLabel}</span>
              </div>
            )}
            {routeItem && (
              <div style={{
                height: 22, borderRadius: 88,
                border: `1px solid ${(routeItem.sub3.length > 263) ? '#E94C4C' : routeItem.sub3.length === 0 ? '#979797' : '#B2FF00'}`,
                padding: '4px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: (routeItem.sub3.length > 263) ? '#E94C4C' : routeItem.sub3.length === 0 ? '#979797' : '#B2FF00', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: (routeItem.sub3.length > 263) ? '#E94C4C' : routeItem.sub3.length === 0 ? '#979797' : '#B2FF00' }}>
                  {routeItem.sub3.length > 263 ? '263+' : routeItem.sub3.length}
                </span>
              </div>
            )}
            <div style={{
              height: 22, borderRadius: 88,
              border: `1px solid ${statusColor}`,
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <img src={isOnline ? '/atlas/images/statistics/iconconnect.png' : '/atlas/images/statistics/iconnoconnect.png'} alt="" width={12} height={12} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>{isOnline ? 'ออนไลน์' : 'ออฟไลน์'}</span>
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
              <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>Google Map</span>
            </button>
            <fieldset style={{ flexShrink: 0, marginLeft: 'auto' }}>
              <label className='block text-[14px] text-(--yellow)'>วันที่แสดงข้อมูล</label>
              <RangePicker
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
      <section className="mt-6 flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
        <IncidentDetailSidebar />
        <div className="flex flex-col flex-1 gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0"><IncidentDonutSection solutionId={detail} startDate={startDate} endDate={endDate} /></div>
            <div className="flex-1 min-w-0"><EventTrendSection solutionId={detail} height={260} showPeakBadge startDate={startDate} endDate={endDate} /></div>
          </div>
          <IncidentDetailTable solutionId={detail} roadCode={roadCode} />
        </div>
      </section>
      {/* Opens from the icbt.png icon in the header — fetches /contact/{project_id}
        * + /department-by-road/{road_id}, same modal as incident-detection detail. */}
      <ProjectInfoModal />
    </div>
  )
}

const IncidentDetailScreen: React.FC = () => {
  return (
    <IncidentDetailProvider>
      <IncidentDetailContent />
    </IncidentDetailProvider>
  )
}

export default React.memo(IncidentDetailScreen)
