"use client"
import React, { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { Button, ConfigProvider, DatePicker, Empty, Spin } from 'antd'
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

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const { RangePicker } = DatePicker

/** Header badge/button sizing — copied verbatim from the shared
 *  `DetailTitleSection` (components/section/DetailTitleSection.tsx) so this
 *  hand-rolled header matches every other detail page: 14px text, 2px/14px
 *  padding, 28px tall. Colours are applied per-element via inline style. */
const BADGE_CLASS =
  'inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'

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
  // Sub-department count pill: red past the cap, gray when empty, else green.
  // Extracted because the same three-way expression was repeated for the
  // border, the dot and the text colour.
  const routeCountColor = !routeItem
    ? '#979797'
    : routeItem.sub3.length > 263
      ? '#E94C4C'
      : routeItem.sub3.length === 0
        ? '#979797'
        : '#B2FF00'

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
            {/* Plain <p>, no font-size override — matches DetailTitleSection's
                `<p>{installPoint}</p>` (16px). The old `var(--fs-12)` is never
                declared anywhere in the app, so it fell back to the inherited
                14px, 2px under every other detail header. */}
            <p style={{ color: '#FFFFFF' }}>
              {detailLabel || '-'}
            </p>
            <img
              src={`${BASE_PATH}/images/statistics/icbt.png`}
              alt="ดูข้อมูลโครงการ"
              title="ดูข้อมูลโครงการ"
              width={24}
              height={24}
              onClick={() => projectId !== undefined && dispatch(setProjectInfoModalOpen({
                open: true,
                project_id: projectId,
                road_id: roadId ?? null,
              }))}
              style={{ cursor: projectId !== undefined ? 'pointer' : 'default', opacity: projectId !== undefined ? 1 : 0.5 }}
            />
            {/* Badge sizing is the shared DetailTitleSection contract
                (`py-0.5 px-3.5 fs-12 rounded-full border` → 14px text,
                2px/14px padding, 28px tall). This header is hand-rolled rather
                than using that component, so the classes are copied verbatim.
                The old inline `height: 28` + `padding: '4px 10px'` hit the
                right height but ran 4px narrow on each side; the button also
                needs a transparent border so its box maths match the pills. */}
            {warranty !== null && (
              <span className={BADGE_CLASS} style={{ borderColor: warrantyColor, color: warrantyColor }}>
                {warrantyLabel}
              </span>
            )}
            {routeItem && (
              <span
                className={BADGE_CLASS}
                style={{ borderColor: routeCountColor, color: routeCountColor }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: routeCountColor, flexShrink: 0 }} />
                {routeItem.sub3.length > 263 ? '263+' : routeItem.sub3.length}
              </span>
            )}
            <span className={BADGE_CLASS} style={{ borderColor: statusColor, color: '#FFFFFF' }}>
              <img src={isOnline ? `${BASE_PATH}/images/statistics/iconconnect.png` : `${BASE_PATH}/images/statistics/iconnoconnect.png`} alt="" width={14} height={14} />
              {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
            </span>
            {/* AntD `<Button size='middle' shape='round'>` (32px, padding
                0 15px) — NOT the 28px pill above. That split is deliberate in
                DetailTitleSection; styling it as a pill made this row 4px
                shorter than every other detail page. */}
            <ConfigProvider theme={{ token: { colorPrimary: '#003F87', colorTextLightSolid: '#FFFFFF' } }}>
              <Button
                type="primary"
                size="middle"
                shape="round"
                disabled={!coord}
                onClick={() => {
                  if (!coord) return
                  window.open(`https://maps.google.com/?q=${coord[1]},${coord[0]}`, '_blank')
                }}
              >
                <p className="fs-12">Google Map</p>
              </Button>
            </ConfigProvider>
            <fieldset style={{ flexShrink: 0, marginLeft: 'auto' }}>
              <label className='block fs-12 text-(--yellow)'>วันที่แสดงข้อมูล</label>
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
            {/* Deliberately NOT bound to the page's dateRange filter (which
                defaults to a 3-day window) — a "daily trend" needs its own
                fixed rolling 7-day window to show a real pattern; falls back
                to EventTrendSection's internal last-7-days default. */}
            <div className="flex-1 min-w-0"><EventTrendSection solutionId={detail} height={284} showPeakBadge /></div>
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
