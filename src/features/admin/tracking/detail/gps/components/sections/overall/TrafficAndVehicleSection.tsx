import { Button, ConfigProvider } from 'antd'
import React, { useMemo, useState } from 'react'
import { TbTrafficLights } from 'react-icons/tb'
import { ChartHourTraffic, ChartWeeklyPattern } from '../../../components'

interface Props {

}


type FilterOption = 'ชั่วโมง' | 'วัน'
const FILTER_OPTIONS: FilterOption[] = ['ชั่วโมง', 'วัน']

const TrafficAndVehicleSection: React.FC<Props> = (props) => {
  const { } = props
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ชั่วโมง')

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
          <p className={`fs-12 ${activeFilter === item ? 'text-(--default-blue)' : 'text-white'}`}>{item}</p>
        </Button>
      </ConfigProvider>
    ))
  }, [activeFilter])

  const renderChartType = useMemo(() => {
    switch (activeFilter) {
      case 'ชั่วโมง':
        return <ChartHourTraffic />
      case 'วัน':
        return <ChartWeeklyPattern />
    }
  }, [activeFilter])

  return (
    <div className='bg-black/80 p-5 rounded-lg'>
      <section>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <TbTrafficLights className='text-(--default-blue) fs-22' />
            <div>
              <h4 className='text-(--default-blue) font-normal!'>รูปแบบการจราจร</h4>
              <p className='fs-12'>การกระจายตามเวลาและวันบนสายทาง ทช.</p>
            </div>
          </div>
          <div className='bg-[#A2A2A233] rounded-3xl p-1.5 flex items-center'>
            {renderOptionButton}
          </div>
        </div>
      </section>
      <section className='mt-5'>
        {renderChartType}
      </section>
    </div>
  )
}

export default React.memo<Props>(TrafficAndVehicleSection)
