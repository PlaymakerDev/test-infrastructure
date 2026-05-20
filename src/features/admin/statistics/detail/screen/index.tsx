"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled, TbChevronDown } from 'react-icons/tb'
import { DatePicker, Collapse } from 'antd'
import dayjs from 'dayjs'
import { SearchCard } from '@/components/search-card'

const { RangePicker } = DatePicker

interface Props {
  detail?: string
}

const DETAIL_ITEMS = [
  { label: 'ชม.3028', detail: '67 - ชม.3028(31) ป้าย 1 : กม.0+300', connected: true },
  { label: 'ชม.3045', detail: '67 - ชม.3045(31) ป้าย 1 : กม.0+500', connected: false },
  { label: 'ชม.3010', detail: '7 - ชม.3010(2) ป้าย 1 : กม.0+100', connected: true },
  { label: 'ชม.3011', detail: '7 - ชม.3011(2) ป้าย 2 : กม.1+500', connected: true },
  { label: 'ชม.3012', detail: '7 - ชม.3012(2) ป้าย 1 : กม.2+300', connected: true },
  { label: 'ชม.3013', detail: '7 - ชม.3013(2) ป้าย 3 : กม.4+000', connected: false },
]

const StatisticsDetailScreen: React.FC<Props> = ({ detail }) => {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs(), dayjs()])

  const filteredItems = React.useMemo(() => {
    if (!searchText) return DETAIL_ITEMS
    const keyword = searchText.toLowerCase()
    return DETAIL_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(keyword) ||
        item.detail.toLowerCase().includes(keyword)
    )
  }, [searchText])

  const handleBack = () => {
    router.push('/admin/statistics?tab=status')
  }

  return (
    <div className="main-screen px-10 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <section className="flex items-start gap-3">
        <TbArrowBigLeftFilled
          className="fs-24 text-(--yellow) cursor-pointer"
          onClick={handleBack}
          style={{ marginTop: 8 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="text-(--yellow)">สายทาง {detail || '-'}</h1>
          <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
            <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 400 }}>
              67 - ชม.3028(31) ป้าย 1 : กม.0+300
            </p>
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
      <section className="mt-6 flex gap-6" style={{ flex: 1, minHeight: 0 }}>
        <div style={{ maxWidth: 370, minWidth: 300, flexShrink: 0 }}>
          <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => setSearchText(value)}>
            <Collapse
              ghost
              expandIcon={({ isActive }) => (
                <TbChevronDown
                  size={20}
                  style={{
                    color: '#FCD116',
                    transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              )}
              style={{ marginTop: 16 }}
              items={filteredItems.map((item) => ({
                key: item.label,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>
                      {item.detail}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {item.connected ? (
                        <img src="/images/statistics/iconconnect.png" alt="connected" width={20} height={20} />
                      ) : (
                        <img src="/images/statistics/iconnoconnect.png.png" alt="no connect" width={20} height={20} />
                      )}
                    </div>
                  </div>
                ),
                style: { marginBottom: 4 },
                classNames: { header: 'rounded-lg bg-[#363636]' },
                styles: {
                  header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 },
                  content: { padding: '8px 0 0 0' },
                  body: { padding: 0 },
                },
              }))}
            />
          </SearchCard>
        </div>
        <div className="flex flex-col flex-1 gap-4">
          <div className="grid grid-cols-5 gap-4" style={{ alignContent: 'start' }}>
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
          <div className="flex gap-4">
            <img src="/images/statistics/card1.png" alt="" style={{ flex: 1, borderRadius: 12 }} />
            <div style={{ flex: 1, borderRadius: 12, position: 'relative' }}>
              <img src="/images/statistics/card2.png" alt="" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', width: 600, height: 60, borderRadius: 8, backgroundColor: '#000000CC', padding: '10px 12px' }}>
                <p style={{ fontSize: 12, fontWeight: 400, color: '#FFFFFF' }}>
                  67FTD-CMI3035-P001-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่
                </p>
                <p style={{ fontSize: 12, fontWeight: 400, color: '#979797', marginTop: 2 }}>
                  IP Address : 10.101.27.2
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(StatisticsDetailScreen)
