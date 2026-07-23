import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useOverallContext } from '@/features/admin/tracking/overall/context'
import { useCctvList } from '@/features/admin/tracking/overall/hooks'
import { Empty, Skeleton } from 'antd'
import React, { useMemo, useState } from 'react'

interface Props {

}

// Cheap discovery page — small enough to learn `meta.total` without paying for
// a large payload up front. When the real total exceeds it, a second request
// fetches everything in one shot so "online" filtering covers every camera,
// not just whatever fit on page 1.
const DISCOVERY_PAGE_SIZE = 10

const WIMCCTVList: React.FC<Props> = (props) => {
  const { } = props
  const { setOpenCCTVData } = useOverallContext()
  const [randomCam] = useState(() => `${Math.random()}`);

  const { data: firstPage, isLoading: isFirstLoading, isError: isFirstError } = useCctvList({
    page: 1,
    page_size: DISCOVERY_PAGE_SIZE,
    station_id: '3'
  })

  const total = firstPage?.data?.meta?.total ?? 0
  const hasMore = total > DISCOVERY_PAGE_SIZE

  const { data: allPages, isLoading: isAllLoading, isError: isAllError } = useCctvList(
    { page: 1, page_size: total, station_id: '3' },
    hasMore
  )

  const data = hasMore ? allPages : firstPage
  const isLoading = isFirstLoading || (hasMore && isAllLoading)
  const isError = isFirstError || (hasMore && isAllError)

  const renderCCTVList = useMemo(() => {
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
    const randomCCTV = data?.data?.data?.filter(item => item.camera_status === 'Online')?.sort(() => Number(randomCam) - 0.5).slice(0, 3)

    if (!randomCCTV || randomCCTV.length === 0) {
      return (
        <figure className='block m-auto'>
          <Empty description="ไม่พบข้อมูล CCTV ในช่วงเวลานี้" />
        </figure>
      )
    }

    return randomCCTV?.map((item) => (
      <div key={item.id} className='flex-1 flex flex-col min-h-0'>
        <HLSLivePlayer
          cameraId={String(item.id)}
          hlsUrl={item.stream_url}
          enableViewportPause
          figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg cursor-pointer'
          onClick={() => setOpenCCTVData({ open: true, item })}
        />
        <h4 className="camera-code">{item.camera_description}</h4>
        <p className="camera-location">{item.station_description}</p>
      </div>
    ))
  }, [data, isLoading, isError, setOpenCCTVData, randomCam])

  return (
    <div className='h-full flex flex-col gap-4'>
      {renderCCTVList}
    </div>
  )
}

export default React.memo<Props>(WIMCCTVList)
