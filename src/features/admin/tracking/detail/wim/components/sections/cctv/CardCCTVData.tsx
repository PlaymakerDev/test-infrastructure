import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import { CCTVList } from '@/types/tracking/overall-api'
import React, { useMemo } from 'react'

interface Props {
  item?: CCTVList
}

const CURRENT_TYPE: Record<string, { text: string; color: string }> = {
  "CCTV": {
    "text": "CCTV",
    "color": "border-[#FF9966] text-[#FF9966]"
  },
  "Tracking": {
    "text": "Tracking",
    "color": "border-[#6EFF66] text-[#6EFF66]"
  }
}

const CardCCTVData: React.FC<Props> = (props) => {
  const { item } = props
  const { setOpenCCTVData } = useWIMContext()

  const list = useMemo(() => {
    return ['CCTV', 'Tracking']
  }, [])

  const renderList = useMemo(() => {
    return list.map((item, index) => (
      <span key={index} className={`inline-block py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${CURRENT_TYPE[item].color}`}>
        {CURRENT_TYPE[item].text}
      </span>
    ))
  }, [list])

  return (
    <div className='bg-(--mid-gray) rounded-2xl p-3'>
      <figure className='flex-1 min-h-0 rounded-lg overflow-hidden mb-1.5'>
        <HLSLivePlayer
          cameraId={String(item?.id)}
          hlsUrl={item?.stream_url}
          enableViewportPause
          figureClassName='figure-large lg:h-72! lg:min-h-0! lg:max-h-none! mb-1.5 rounded-lg cursor-pointer'
          onClick={() => setOpenCCTVData({ open: true, item: item ?? null })}
        />
      </figure>
      <section>
        <h4 className={`fs-12 font-normal! ${item?.camera_status === "Online" ? 'text-(--default-blue)' : 'text-red-500'} leading-snug break-all mb-0.5`}>{item?.camera_description || '-'}</h4>
        <div className='flex justify-between items-center flex-wrap gap-3'>
          <p className='fs-12 text-white/50 leading-snug m-0'>IP Address : {item?.station_description || '-'}</p>
          <div className='flex gap-2 items-center flex-wrap'>
            {renderList}
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(CardCCTVData)
