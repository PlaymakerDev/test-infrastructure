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

const MobileStationData: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='flex flex-col gap-4 md:flex-1 md:min-h-0'>
      <div className='flex flex-col bg-(--dark-black) border border-blue-500/50 py-3 px-5 rounded-lg md:flex-1 md:min-h-0'>
        <figure className='figure-large rounded-md overflow-hidden md:flex-1 md:min-h-0 md:max-h-none'>
          <Swiper
            loop
            modules={[Pagination]}
            className="page-swiper swiper-fill h-full"
          >
            {IMAGES?.map((item, index) => {
              return (
                <SwiperSlide key={index} className="h-full!">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    width={"100%"}
                    height={"100%"}
                    className='object-cover object-center w-full h-full'
                  />
                </SwiperSlide>
              )
            })}
          </Swiper>
        </figure>
        <section className='shrink-0 pt-2'>
          <p className='text-pink-500'>หน่วยงาน : ขทช.อุตรดิตถ์</p>
          <p className='text-gray-400'>ร่วมบูรณาการ : ทช.</p>
          <p className='text-yellow-500'>วันที่จัดตั้ง : 8 เม.ย. 2569</p>
        </section>
      </div>
      <div className='flex flex-col bg-(--dark-black) border border-blue-500/50 py-3 px-5 rounded-lg md:flex-1 md:min-h-0'>
        <figure className='figure-large rounded-md overflow-hidden md:flex-1 md:min-h-0 md:max-h-none'>
          <Swiper
            loop
            modules={[Pagination]}
            className="page-swiper swiper-fill h-full"
          >
            {IMAGES?.map((item, index) => {
              return (
                <SwiperSlide key={index} className="h-full!">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    width={"100%"}
                    height={"100%"}
                    className='object-cover object-center w-full h-full'
                  />
                </SwiperSlide>
              )
            })}
          </Swiper>
        </figure>
        <section className='shrink-0 pt-2'>
          <p className='text-pink-500'>หน่วยงาน : ขทช.อุตรดิตถ์</p>
          <p className='text-gray-400'>ร่วมบูรณาการ : ทช.</p>
          <p className='text-yellow-500'>วันที่จัดตั้ง : 8 เม.ย. 2569</p>
        </section>
      </div>
    </div>
  )
}

export default React.memo<Props>(MobileStationData)
