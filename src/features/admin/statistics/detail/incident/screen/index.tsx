"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { IncidentDetailProvider, useIncidentDetailContext } from '../context'
import { IncidentDetailSidebar, IncidentDetailTable } from '../components'
import { ROUTE_ITEMS } from '../../../data/routeItems'

const { RangePicker } = DatePicker

const IncidentDetailContent: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const route = searchParams.get('route') || ''
  const detail = searchParams.get('detail') || ''
  const { dateRange, setDateRange } = useIncidentDetailContext()

  const routeItem = ROUTE_ITEMS.find((r) => r.name === route)
  const isExpired = (routeItem?.sub3.length ?? 0) >= 99
  const warrantyColor = isExpired ? '#979797' : '#05F2DB'
  const warrantyLabel = isExpired ? 'หมดค้ำ' : 'ในค้ำ'

  const handleBack = () => {
    router.push('/admin/statistics?incident')
  }

  return (
    <div className="main-screen px-4 sm:px-6 lg:px-10 flex flex-col" style={{ paddingBottom: 60 }}>
      <section className="flex items-start gap-3">
        <TbArrowBigLeftFilled
          className="fs-24 text-(--yellow) cursor-pointer"
          onClick={handleBack}
          style={{ marginTop: 8 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="text-(--yellow)">สายทาง {route || detail || '-'}</h1>
          <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
            <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 400 }}>
              {detail || '67 - ชม.3028(31) ป้าย 1 : กม.0+300'}
            </p>
            <img src="/atlas/images/statistics/icbt.png" alt="" width={25} height={25} />
            <div style={{
              height: 22, borderRadius: 88,
              border: `1px solid ${warrantyColor}`,
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: warrantyColor }}>{warrantyLabel}</span>
            </div>
            {routeItem && (
              <div style={{
                height: 22, borderRadius: 88,
                border: `1px solid ${(routeItem.sub3.length > 263) ? '#E94C4C' : routeItem.sub3.length === 0 ? '#979797' : '#B2FF00'}`,
                padding: '4px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: (routeItem.sub3.length > 263) ? '#E94C4C' : routeItem.sub3.length === 0 ? '#979797' : '#B2FF00', flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 500, color: (routeItem.sub3.length > 263) ? '#E94C4C' : routeItem.sub3.length === 0 ? '#979797' : '#B2FF00' }}>
                  {routeItem.sub3.length > 263 ? '263+' : routeItem.sub3.length}
                </span>
              </div>
            )}
            <div style={{
              height: 22, borderRadius: 88,
              border: '1px solid #66AEFF',
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <img src="/atlas/images/statistics/iconconnect.png" alt="" width={12} height={12} />
              <span style={{ fontSize: 10, fontWeight: 500, color: '#FFFFFF' }}>ออนไลน์</span>
            </div>
            <div style={{
              height: 22, borderRadius: 88,
              backgroundColor: '#003F87',
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#FFFFFF' }}>Google Map</span>
            </div>
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
            <img src="/atlas/images/statistics/c1ex.png" alt="" style={{ flex: 1, borderRadius: 12, minWidth: 0 }} />
            <div style={{ flex: 1, borderRadius: 12, position: 'relative', minWidth: 0 }}>
              <img src="/atlas/images/statistics/c2ex.png" alt="" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            </div>
          </div>
          <IncidentDetailTable />
        </div>
      </section>
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
