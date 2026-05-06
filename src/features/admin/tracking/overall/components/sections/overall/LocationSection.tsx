"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { Button, ConfigProvider } from 'antd'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules';
import ReactMap from '@/components/map/ReactMap'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import '@/styles/map.css'
import 'swiper/css'

const FILTER_OPTIONS = ['ทั้งหมด', 'สถานี', 'WIM', 'เคลื่อนที่']

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

const LocationSection = () => {
  const [activeFilter, setActiveFilter] = useState('ทั้งหมด')

  const renderCameraList = useCallback((type: 'PC' | 'MOBILE') => {
    if (type === 'MOBILE') {
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
    }

    if (type === 'PC') {
      return mockCameras.map((item) => (
        <div className="camera-item" key={item.id}>
          <figure className="camera-thumb">
            <HLSLivePlayer />
          </figure>
          <h4 className="camera-code">{item.code}</h4>
          <p className="camera-location">{item.location}</p>
        </div>
      ))
    }

    return
  }, [])

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
    <div className="location-section">

      {/* ── Desktop: scrollable camera list ── */}
      <div className="camera-list">
        {renderCameraList('PC')}
      </div>

      {/* ── Mobile: swiper camera list ── */}
      <div className="mobile-cam-list">
        <Swiper
          slidesPerView={1}
          grabCursor
          modules={[Autoplay]}
          autoplay={{
            delay: 3000,
            pauseOnMouseEnter: true
          }}
        >
          {renderCameraList('MOBILE')}
        </Swiper>
      </div>

      {/* ── Map with filter overlay ── */}
      <div className="map-wrapper">
        <div className="filter-bar">
          <div className='bg-[#A2A2A233] rounded-3xl p-1.5'>
            <div className='flex items-center gap-3'></div>
            {renderOptionButton}
          </div>
        </div>
        <ReactMap />
      </div>

    </div>
  )
}

export default React.memo(LocationSection)
