import React, { useMemo, useState } from 'react'
import {
  TRACKING_STATIONS,
  type TrackingStationType,
} from '@/features/admin/tracking/overall/data/trackingStations'
import { Button, ConfigProvider } from 'antd'

interface Props {

}

type FilterOption = 'วันนี้' | '3 วัน' | '7 วัน'
const FILTER_OPTIONS: FilterOption[] = ['วันนี้', '3 วัน', '7 วัน']

const VehicleRoute: React.FC<Props> = (props) => {
  const { } = props
  const [activeFilter, setActiveFilter] = useState<FilterOption>('วันนี้')

  const renderOptionButton = useMemo(() => {
    return FILTER_OPTIONS.map((item) => (
      <ConfigProvider
        key={item}
        theme={{
          token: {
            colorPrimary: '#212121',
          }
        }}
      >
        <Button
          shape='round'
          type={activeFilter === item ? 'primary' : 'text'}
          size='medium'
          onClick={() => {
            setActiveFilter(item)
          }}
        >
          <p className={`fs-12 ${activeFilter === item ? 'text-(--yellow)' : 'text-white'}`}>{item}</p>
        </Button>
      </ConfigProvider>
    ))
  }, [activeFilter])

  return (
    <div className='rounded-lg p-5 bg-(--gray)'>
      <section>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h3 className='font-bold text-(--yellow) leading-tight'>เส้นทางการเคลื่อนที่</h3>
          <div className='bg-[#A2A2A233] rounded-3xl p-1.5 flex items-center'>
            {renderOptionButton}
          </div>
        </div>
      </section>
      <section className='mt-5 flex flex-col gap-3'>
        <div className='rounded-lg px-5 py-3 bg-(--dark-black)'>
          <h4>WIM สมุทรปราการ (สป.2001) ขวาทาง กม.2+100</h4>
          <p className='fs-12 text-gray-400'>31 มี.ค. 2569 15:08:42</p>
          <p className='fs-12 text-(--yellow)'>ความเร็ว : 68 กม./ชม.</p>
        </div>
        <div className='rounded-lg px-5 py-3 bg-(--dark-black)'>
          <h4>WIM สมุทรปราการ (สป.2001) ขวาทาง กม.2+100</h4>
          <p className='fs-12 text-gray-400'>31 มี.ค. 2569 18:26:48</p>
          <p className='fs-12 text-(--yellow)'>ความเร็ว : 84 กม./ชม.</p>
        </div>
        <div className='rounded-lg px-5 py-3 bg-(--dark-black)'>
          <h4>แยกทางหลวงหมายเลข 4 (กม.ที่ 70+112) - ถนนสาย ก. ฝั่งเมืองรวมเมืองสะเดา</h4>
          <p className='fs-12 text-gray-400'>31 มี.ค. 2569 23:18:36</p>
          <p className='fs-12 text-(--yellow)'>ความเร็ว : 37 กม./ชม.</p>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(VehicleRoute)
