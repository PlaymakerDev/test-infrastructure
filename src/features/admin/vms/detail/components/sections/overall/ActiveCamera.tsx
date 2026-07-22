"use client"
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'

interface Props {
  data?: APIResponseVMSDetail
}

const ActiveCamera: React.FC<Props> = (props) => {
  const { data } = props
  const cameras = data?.vms_camera ?? []
  const dispatch = useAppDispatch()

  return (
    <div className='flex-1 min-h-0 flex flex-col bg-black/40 backdrop-blur-xs rounded-2xl p-5'>
      <Swiper
        loop={cameras.length > 1}
        modules={[Pagination]}
        pagination={{ clickable: true }}
        className='w-full flex-1 min-h-0'
      >
        {cameras.map((item, index) => (
          <SwiperSlide key={item.id ?? index} className='bg-transparent! h-full! flex flex-col pb-7'>
            <HLSLivePlayer
              cameraId={String(item.camera.id)}
              hlsUrl={item.camera.hls_url}
              enableViewportPause
              figureClassName='flex-1 min-h-0 w-full mb-2 rounded-2xl overflow-hidden cursor-pointer'
              onClick={() => dispatch(setCCTVModalOpen({ open: true, camera_id: item.camera_id }))}
            />
            {/* Same caption design as the VMS overall random-camera card
              * (CCTVSection): `camera-code` wraps long names via word-break and
              * `camera-location` for the IP line — so a long VMS caption (e.g.
              * "TrafficSign : …") wraps inside the card instead of overflowing. */}
            <h4 className='camera-code'>{item.camera.camera_name || '-'}</h4>
            <p className='camera-location'>IP Address : {item.camera.ip_address || '-'}</p>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default React.memo<Props>(ActiveCamera)
