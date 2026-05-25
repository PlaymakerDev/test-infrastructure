import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { Image } from 'antd'
import React from 'react'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

interface Props {

}

const IMAGES = [
  {
    "image": "https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg",
    "alt": "Sparkle and Sparxie relation explained"
  },
  {
    "image": "https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg",
    "alt": "Sparkle and Sparxie relation explained"
  },
]

const CCTVSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='flex flex-col gap-4 md:flex-1 md:min-h-0'>
      <div className='flex flex-col bg-(--mid-gray) py-3 px-5 rounded-lg md:flex-1 md:min-h-0'>
        <figure className='figure-large rounded-md overflow-hidden md:flex-1 md:min-h-0 md:max-h-none'>
          <HLSLivePlayer />
        </figure>
        <section className='shrink-0 pt-2'>
          <p className='text-blue-500'>67FTD-CMI2025-FAI037-กม.00+400-มุ่งหน้าแจ่งศรีภูมิ</p>
          <p className='text-gray-400'>IP Address : 192.168.30.119</p>
        </section>
      </div>
      <div className='flex flex-col bg-(--mid-gray) py-3 px-5 rounded-lg md:flex-1 md:min-h-0'>
        <figure className='figure-large rounded-md overflow-hidden md:flex-1 md:min-h-0 md:max-h-none'>
          <HLSLivePlayer />
        </figure>
        <section className='shrink-0 pt-2'>
          <p className='text-blue-500'>67TRC-SPK4009-C007-Cross walk2-ขาเข้ามุ่งหน้าถ.ศรีนครินทร์</p>
          <p className='text-gray-400'>IP Address : 10.172.26.17</p>
        </section>
      </div>
      <div className='flex flex-col bg-(--mid-gray) py-3 px-5 rounded-lg md:flex-1 md:min-h-0'>
        <figure className='figure-large rounded-md overflow-hidden md:flex-1 md:min-h-0 md:max-h-none'>
          <HLSLivePlayer />
        </figure>
        <section className='shrink-0 pt-2'>
          <p className='text-blue-500'>67TRC-SPK4009-C009-Cross walk3-ขาออกมุ่งหน้า ถ.สุขุมวิท</p>
          <p className='text-gray-400'>IP Address : 10.101.27.1</p>
        </section>
      </div>
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
