import React from 'react'
import { WeatherChart, TemperatureChart } from '../../../components'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

interface Props {
  data?: APIResponseVMSDetail
}

const ChartContent: React.FC<Props> = (props) => {
  const { data } = props
  console.log(">>>>>>>>>", data)
  return (
    <Swiper
      modules={[Pagination]}
      pagination={{ clickable: true }}
      autoHeight
      className='w-full'
      autoplay={{
        delay: 15000
      }}
    >
      <SwiperSlide className='bg-transparent! pb-7'>
        <WeatherChart data={data} />
      </SwiperSlide>
      <SwiperSlide className='bg-transparent! pb-7'>
        <TemperatureChart data={data} />
      </SwiperSlide>
    </Swiper>
  )
}

export default React.memo<Props>(ChartContent)
