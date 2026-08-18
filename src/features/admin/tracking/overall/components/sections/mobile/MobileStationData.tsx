import { useCollaboration } from '@/features/admin/tracking/overall/hooks'
import { Empty, Image, Skeleton } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo, useState } from 'react'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import { EMPTY_FALLBACK } from '@/constants'
import { TRACKING_STATION_COLORS } from '@/features/admin/tracking/overall/data/trackingStations'

interface Props {

}

// const IMAGES = [
//   {
//     "image": "https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg",
//     "alt": "Sparkle and Sparxie relation explained"
//   },
//   {
//     "image": "https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg",
//     "alt": "Sparkle and Sparxie relation explained"
//   },
// ]

const MobileStationData: React.FC<Props> = (props) => {
  const { } = props
  const [randomCollaboration] = useState(() => `${Math.random()}`);

  const { data, isLoading, isError } = useCollaboration({
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    page: 1,
    page_size: 10,
    order: 'ASC'
  })

  const renderCollaboration = useMemo(() => {
    // RENDER COMPONENT LOADING
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, index) => {
        return (
          <div key={index} className='flex-1 min-h-0 flex flex-col'>
            <Skeleton loading active paragraph={{ rows: 5 }} />
          </div>
        )
      })
    }
    // RENDER COMPONENT ERROR
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    // RENDER COMPONENT WITH DATA
    const collabList = data?.data?.data?.sort(() => Number(randomCollaboration) - 0.5).slice(0, 2)

    if (!collabList || collabList.length === 0) {
      return (
        <figure className='block m-auto'>
          <Empty description="ไม่พบข้อมูลการร่วมบูรณาการในช่วงเวลานี้" />
        </figure>
      )
    }

    return collabList?.map((item) => {
      const IMAGES = [
        {
          "image": item.image_path1,
          "alt": item.image_name1
        },
        {
          "image": item.image_path2,
          "alt": item.image_name2
        },
      ]
      return (
        (
          <div key={item.uid} className='flex flex-col bg-(--dark-black) border border-blue-500/50 py-3 px-5 rounded-lg md:flex-1 md:min-h-0'>
            <figure className='figure-large rounded-md overflow-hidden md:flex-1 md:min-h-0 md:max-h-none'>
              <Swiper
                loop
                modules={[Pagination]}
                pagination={{ clickable: true }}
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
                        fallback={EMPTY_FALLBACK}
                      />
                    </SwiperSlide>
                  )
                })}
              </Swiper>
            </figure>
            <section className='shrink-0 pt-2'>
              {/* Same ม่วงพิ้งค์ as this tab's map pin — TRACKING_STATION_COLORS.mobile
                  is the single source of truth and matches Moving.svg's own fill
                  (the old `text-pink-500` #EC4899 read as a different hue). */}
              <p className='fs-12' style={{ color: TRACKING_STATION_COLORS.mobile }}>หน่วยงาน : {item.department_name || '-'}</p>
              <p className='fs-12 text-gray-400'>ร่วมบูรณาการ : {item.collaboration || '-'}</p>
              <p className='fs-12 text-(--yellow)'>วันที่จัดตั้ง : {dayjs(item.create_date, 'DD/MM/BBBB').format('DD MMM BBBB')}</p>
            </section>
          </div>
        )
      )
    })
  }, [data, isLoading, isError, randomCollaboration])

  return (
    <div className='flex flex-col gap-4 md:flex-1 md:min-h-0'>
      {renderCollaboration}
    </div>
  )
}

export default React.memo<Props>(MobileStationData)
