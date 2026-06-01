"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { StatusDetailProvider, useStatusDetailContext } from '../context'
import { DetailSidebar, DrawerDetailSidebar, StatusDetailTable } from '../components'

const { RangePicker } = DatePicker


const StatusDetailContent: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const route = searchParams.get('route') || ''
  const detail = searchParams.get('detail') || ''
  const { dateRange, setDateRange } = useStatusDetailContext()

  const handleBack = () => {
    router.push('/admin/statistics?status')
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
          <h1 className="text-(--yellow)">สายทาง {route || detail || '-'}</h1>
          <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
            <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 400 }}>
              {detail || '67 - ชม.3028(31) ป้าย 1 : กม.0+300'}
            </p>
            <img src="/images/statistics/icbt.png" alt="" width={25} height={25} />
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
              <img src="/images/statistics/iconconnect.png" alt="" width={12} height={12} />
              <span style={{ fontSize: 10, fontWeight: 500, color: '#FFFFFF' }}>
                ออนไลน์
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
            <div style={{
              height: 22, borderRadius: 88,
              backgroundColor: '#66AEFF',
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <img src="/images/statistics/icand.png" alt="" width={12} height={12} />
              <span style={{ fontSize: 10, fontWeight: 500, color: '#000000' }}>
                Anydesk : 1194336831
              </span>
            </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4" style={{ alignContent: 'start' }}>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #66AEFF' }}>
              <img src="/images/statistics/icc1.png" alt="" width={40} height={40} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#66AEFF', marginTop: 8 }}>สถานะการทำงานของป้าย</p>
              <p style={{ fontSize: 32, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>ทำงานปกติ</p>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #4CE99A' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#4CE99A' }}>Stream</p>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 16, display: 'block' }}>Connect</span>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#979797' }}>ZeroTier IP : 10.210.1.70</p>
              <p style={{ fontSize: 10, fontWeight: 400, color: '#999999' }}>อัพเดรตล่าสุด : 20 เม.ย. 2569 13:32:30</p>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #E98B4C' }}>
              <img src="/images/statistics/icc3.png" alt="" width={40} height={40} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#E98B4C', marginTop: 8 }}>Traffic Camera</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>Connect</p>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #E9D44C' }}>
              <img src="/images/statistics/icc4.png" alt="" width={40} height={40} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#E9D44C', marginTop: 8 }}>Number Of Formats</p>
              <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Inter', color: '#FFFFFF', marginTop: 4 }}>5</p>
            </div>
            <div style={{ backgroundColor: '#66AEFF1A', borderRadius: 12, padding: 16, border: '2px solid #AFE94C' }}>
              <img src="/images/statistics/icc5.png" alt="" width={40} height={40} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#AFE94C', marginTop: 8 }}>VMS Format</p>
              <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Inter', color: '#FFFFFF', marginTop: 4 }}>MP4</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <img src="/images/statistics/card1.png" alt="" style={{ flex: 1, borderRadius: 12, minWidth: 0 }} />
            <div style={{ flex: 1, borderRadius: 12, position: 'relative', minWidth: 0 }}>
              <img src="/images/statistics/card2.png" alt="" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 600, borderRadius: 8, backgroundColor: '#000000CC', padding: '8px 12px' }}>
                <p style={{ fontSize: 12, fontWeight: 400, color: '#FFFFFF' }}>
                  67FTD-CMI3035-P001-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่
                </p>
                <p style={{ fontSize: 12, fontWeight: 400, color: '#979797', marginTop: 2 }}>
                  IP Address : 10.101.27.2
                </p>
              </div>
            </div>
          </div>
          <StatusDetailTable />
        </div>
      </section>
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
