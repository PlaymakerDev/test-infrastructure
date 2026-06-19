"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { AlertDetailProvider, useAlertDetailContext } from '../context'
import { AlertDetailSidebar, AlertDetailTable } from '../components'

const { RangePicker } = DatePicker

const AlertDetailContent: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const route = searchParams.get('route') || ''
  const detail = searchParams.get('detail') || ''
  const { dateRange, setDateRange } = useAlertDetailContext()

  const handleBack = () => {
    router.push('/admin/statistics?alert')
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
              border: '1px solid #05F2DB',
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#FFFFFF' }}>
                ในค้ำ
              </span>
            </div>
            <div style={{
              height: 22, borderRadius: 88,
              border: '1px solid #66AEFF',
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <img src="/atlas/images/statistics/iconconnect.png" alt="" width={12} height={12} />
              <span style={{ fontSize: 10, fontWeight: 500, color: '#FFFFFF' }}>
                ออนไลน์
              </span>
            </div>
            <div style={{
              height: 22, borderRadius: 88,
              border: '1px solid #E9D682',
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#E9D682' }}>
                3 Phase
              </span>
            </div>
            <div style={{
              height: 22, borderRadius: 88,
              backgroundColor: '#003F87',
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#FFFFFF' }}>
                Google Map
              </span>
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
        <AlertDetailSidebar />
        <div className="flex flex-col flex-1 gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4" style={{ alignContent: 'start' }}>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #66AEFF' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#66AEFF' }}>สถานะการเชื่อมต่อ</p>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>เชื่อมต่อแล้ว</span>
              <p style={{ fontSize: 11, fontWeight: 400, color: '#979797', marginTop: 6 }}>IMEI : 860946061754746</p>
              <p style={{ fontSize: 10, fontWeight: 400, color: '#999999', marginTop: 2 }}>อัพเดรตล่าสุด : 20 เม.ย. 2569 13:32:30</p>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #E98B4C' }}>
              <img src="/atlas/images/statistics/ct2.png" alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#E98B4C', marginTop: 8 }}>Line Check</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>FAIL</span>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #E9D44C' }}>
              <img src="/atlas/images/statistics/ct3.png" alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#E9D44C', marginTop: 8 }}>Circuit</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>OK</span>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #AFE94C' }}>
              <img src="/atlas/images/statistics/ct4.png" alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#AFE94C', marginTop: 8 }}>Volt / Amp</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>OK</span>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #4CE99A' }}>
              <img src="/atlas/images/statistics/ct5.png" alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#4CE99A', marginTop: 8 }}>สถานะสาย</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>Connect</span>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #4CD1E9' }}>
              <img src="/atlas/images/statistics/ct6.png" alt="" width={30} height={30} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#4CD1E9', marginTop: 8 }}>สถานะวงจร</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 8, display: 'block' }}>Disconnect</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <img src="/atlas/images/statistics/c1ex.png" alt="" style={{ flex: 1, borderRadius: 12, minWidth: 0 }} />
            <div style={{ flex: 1, borderRadius: 12, position: 'relative', minWidth: 0 }}>
              <img src="/atlas/images/statistics/c2ex.png" alt="" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            </div>
          </div>
          <AlertDetailTable />
        </div>
      </section>
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
