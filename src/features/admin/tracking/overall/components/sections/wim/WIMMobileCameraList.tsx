"use client"
import React, { useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules';
import HLSLivePlayer from '@/components/video/HLSLivePlayer';

interface Props {

}

const mockCameras = [
  {
    id: 1,
    code: 'DRR-CCO-Weight-CAM01 (N) ขาออก ด่านชั่ง',
    location: 'สถานีด่านฯ ฉะเชิงเทรา',
  },
  {
    id: 2,
    code: '6B4M-WIM-NON1002-CAM001',
    location: 'WIM นนทบุรี (นน.1002) ฝั่งบาง',
  },
  {
    id: 3,
    code: '67PSK-WIM-NON4018-F002',
    location: 'WIM เลี้ยงเมืองนนทบุรี (นน.4018)',
  },
]


const WIMMobileCameraList: React.FC<Props> = (props) => {
  const { } = props

  const renderCameraList = useMemo(() => {
    return mockCameras.map((item) => (
      <SwiperSlide key={item.id}>
        <div className="camera-item">
          <figure className="camera-thumb">
            <HLSLivePlayer />
          </figure>
          <h4 className="camera-code">{item.code}</h4>
          <p className="camera-location">{item.location}</p>
        </div>
      </SwiperSlide>
    ))
  }, [])


  return (
    <Swiper
      slidesPerView={1}
      grabCursor
      modules={[Autoplay]}
      autoplay={{
        delay: 3000,
        pauseOnMouseEnter: true
      }}
    >
      {renderCameraList}
    </Swiper>
  )
}

export default React.memo<Props>(WIMMobileCameraList)
