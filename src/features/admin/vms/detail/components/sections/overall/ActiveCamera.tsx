"use client"
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import React, { useState } from 'react'
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
  // Pagination rendered as its own block below the swiper (via `pagination.el`
  // pointing at this plain div) instead of Swiper's default overlaid bullets —
  // the overlay used to sit on top of the caption text, and reserving space
  // for it with slide padding still clipped the IP-address line whenever a
  // slide's content ran taller than the (previously flex-1-constrained)
  // swiper. `autoHeight` below lets the swiper itself size to each slide's
  // real content instead of being clipped to the parent's available space.
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null)

  return (
    <div className='flex flex-col bg-black/40 backdrop-blur-xs rounded-2xl p-5'>
      {/* No `loop` — Swiper duplicates slide DOM nodes for seamless
        * wraparound, and that combined with `autoHeight` is fragile right at
        * small slide counts (Swiper's own loop mode wants at least 2x
        * slidesPerView slides to stay stable); with exactly 2 cameras this
        * showed up as two independent HLSLivePlayer/LoadingIndicator
        * instances rendering on top of each other. `ChartContent.tsx` in
        * this same feature already proves autoHeight alone is stable. */}
      <Swiper
        modules={[Pagination]}
        pagination={paginationEl ? { el: paginationEl, clickable: true } : false}
        autoHeight
        className='w-full'
      >
        {cameras.map((item, index) => (
          <SwiperSlide key={item.id ?? index} className='bg-transparent! flex flex-col'>
            <HLSLivePlayer
              cameraId={String(item.camera.id)}
              hlsUrl={item.camera.hls_url}
              enableViewportPause
              figureClassName='figure-normal w-full mb-2 rounded-lg overflow-hidden cursor-pointer'
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
      <div ref={setPaginationEl} className='flex justify-center gap-1.5 mt-2' />
    </div>
  )
}

export default React.memo<Props>(ActiveCamera)
