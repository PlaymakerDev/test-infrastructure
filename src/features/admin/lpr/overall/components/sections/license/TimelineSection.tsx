"use client"
import { Button, ConfigProvider, Empty, Spin, Timeline } from 'antd'
import React, { useMemo } from 'react'
import { TbPrinter } from 'react-icons/tb'
import TimelineCard from './TimelineCard'
import QueryBoundary from '@/components/common/QueryBoundary'
import { useOverallContext } from '../../../context'
import { usePlateDetail, useTimelineInfinite } from '@/hooks/queries/lpr'
import type { LicenseTimelineItem } from '@/components/list/LicenseList'
import type { LPRTimelineEvent } from '@/types/lpr/lpr-api'

const toTimelineItem = (e: LPRTimelineEvent): LicenseTimelineItem => ({
  id: e.id,
  image: e.vehicle_image ?? '',
  title: e.detection_point ?? 'ไม่ระบุจุดตรวจจับ',
  timestamp: e.captured_at_display,
  camera_name: e.camera_name ?? '',
  // WIM only — ANPR has no overweight concept, so the badge is hidden.
  status: e.is_overweight == null ? undefined : e.is_overweight ? 'เกินพิกัด' : 'ไม่เกินพิกัด',
  speed: e.speed != null ? String(e.speed) : '-',
  lane: e.lane != null ? String(e.lane) : '-',
  weight: e.grossweight != null ? String(e.grossweight) : undefined,
  legal_weight: e.legalweight != null ? String(e.legalweight) : undefined,
})

const TimelineSection: React.FC = () => {
  const { selected } = useOverallContext()
  const { data: detail } = usePlateDetail(selected?.plate_province, selected?.plate_number)
  const {
    data: timelineData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTimelineInfinite(selected?.plate_province, selected?.plate_number)

  const events = useMemo(
    // res_data can be null (not []) when there are no events — guard it.
    () => (timelineData?.pages ?? []).flatMap((page) => page.res_data ?? []),
    [timelineData]
  )

  const firstSeen = detail?.first_seen

  // Metadata cards branch on the latest detection's source:
  //  • WIM  → a single "ประเภทยานพาหนะ" card (per design — vehicle_type_name is
  //           already the full "ประเภท N : … เพลา … (… ตัน)" string).
  //  • ANPR → the full 4-field grid; a missing/blank value shows "-".
  const isWim = detail?.latest?.source === 'wim'
  const metaCards = useMemo(() => {
    const m = detail?.metadata
    if (!m) return []
    const val = (v: string | number | null | undefined) =>
      v != null && String(v).trim() !== '' ? String(v) : '-'
    if (detail?.latest?.source === 'wim') {
      return [{ label: 'ประเภทยานพาหนะ', value: val(m.vehicle_type_name) }]
    }
    return [
      { label: 'ประเภทป้ายทะเบียน', value: val(m.plate_type) },
      { label: 'ประเภทยานพาหนะ', value: val(m.vehicle_type_name) },
      { label: 'ยี่ห้อ', value: val(m.vehicle_brand) },
      { label: 'สียานพาหนะ', value: val(m.vehicle_color) },
    ]
  }, [detail])

  return (
    <div className='lg:px-8'>
      {/* Header */}
      <section className='flex flex-wrap items-start justify-between gap-4'>
        {/* License info */}
        <div className='flex flex-col gap-0.5'>
          <h1>{selected?.plate_number}</h1>
          <p>{selected?.plate_province}</p>
          {firstSeen && (
            <p className='text-gray-400'>
              ตรวจพบครั้งแรก {firstSeen.detection_point ?? 'ไม่ระบุจุดตรวจจับ'} เมื่อวันที่ {firstSeen.captured_at_display}
            </p>
          )}
        </div>

        {/* Action buttons — export + view-more (unwired, pending spec) */}
        <div className='flex items-center gap-2 shrink-0'>
          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button type='primary' size='medium' shape='round' icon={<TbPrinter />}>
              นำออกเอกสาร
            </Button>
          </ConfigProvider>
          <ConfigProvider theme={{ token: { colorPrimary: '#979797', colorTextLightSolid: '#0A0A0A' } }}>
            <Button type='primary' size='medium' shape='round'>
              ดูเพิ่มเติม
            </Button>
          </ConfigProvider>
        </div>
      </section>

      {/* Vehicle metadata — single card for WIM, 4-field grid for ANPR */}
      {metaCards.length > 0 && (
        <section className={isWim ? 'mt-10' : 'mt-10 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4'}>
          {metaCards.map(({ label, value }) => (
            <div key={label} className='bg-(--yellow)/10 border-2 border-(--yellow) rounded-lg p-5'>
              <p className='text-(--yellow)'>{label}</p>
              <p className='font-bold'>{value}</p>
            </div>
          ))}
        </section>
      )}

      {/* Timeline */}
      <section className='mt-5'>
        <div className='bg-(--gray) py-8 px-10 rounded-lg'>
          <h1 className='text-(--yellow) mb-5'>Vehicle Detection Timeline</h1>
          <QueryBoundary isLoading={isLoading} isError={isError} skeletonRows={6}>
            {events.length ? (
              <>
                <Timeline
                  variant='filled'
                  mode='start'
                  items={events.map((event, index) => ({
                    content: <TimelineCard key={event.id} item={toTimelineItem(event)} isFirst={index === 0} />,
                  }))}
                />
                {hasNextPage && (
                  <div className='flex justify-center mt-4'>
                    <Button
                      type='primary'
                      shape='round'
                      loading={isFetchingNextPage}
                      onClick={() => fetchNextPage()}
                    >
                      ดูเพิ่มเติม
                    </Button>
                  </div>
                )}
                {isFetchingNextPage && !hasNextPage && (
                  <div className='flex justify-center mt-4'><Spin size='small' /></div>
                )}
              </>
            ) : (
              <Empty description='ไม่พบข้อมูลการตรวจจับยานพาหนะ' />
            )}
          </QueryBoundary>
        </div>
      </section>
    </div>
  )
}

export default React.memo(TimelineSection)
