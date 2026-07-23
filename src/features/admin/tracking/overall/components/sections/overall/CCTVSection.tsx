import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useOverallContext } from '@/features/admin/tracking/overall/context'
import { useCctvList } from '@/features/admin/tracking/overall/hooks'
import { Empty, Skeleton } from 'antd'
import React, { useMemo, useState } from 'react'

interface Props {

}

// const mockCameras = [
//   {
//     id: 1,
//     code: 'DRR-CCO-Weight-CAM01 (N) ขาออก ด่านชั่ง',
//     location: 'สถานีด่านฯ ฉะเชิงเทรา',
//   },
//   {
//     id: 2,
//     code: '6B4M-WIM-NON1002-CAM001',
//     location: 'WIM นนทบุรี (นน.1002) ฝั่งบาง',
//   },
//   {
//     id: 3,
//     code: '67PSK-WIM-NON4018-F002',
//     location: 'WIM เลี้ยงเมืองนนทบุรี (นน.4018)',
//   },
// ]

// Cheap discovery page — small enough to learn `meta.total` without paying for
// a large payload up front. When the real total exceeds it, a second request
// fetches everything in one shot so "online" filtering covers every camera,
// not just whatever fit on page 1.
const DISCOVERY_PAGE_SIZE = 10

const CCTVSection: React.FC<Props> = (props) => {
  const { } = props
  const { setOpenCCTVData } = useOverallContext()
  const [randomCam] = useState(() => `${Math.random()}`);

  const { data: firstPage, isLoading: isFirstLoading, isError: isFirstError } = useCctvList({
    page: 1,
    page_size: DISCOVERY_PAGE_SIZE,
  })

  const total = firstPage?.data?.meta?.total ?? 0
  const hasMore = total > DISCOVERY_PAGE_SIZE

  const { data: allPages, isLoading: isAllLoading, isError: isAllError } = useCctvList(
    { page: 1, page_size: total },
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
    return randomCCTV?.map((item) => (
      <div key={item.id} className='flex-1 min-h-0 flex flex-col'>
        <figure className='flex-1 min-h-0 rounded-lg overflow-hidden mb-1.5'>
          <HLSLivePlayer
            cameraId={String(item.id)}
            hlsUrl={item.stream_url}
            enableViewportPause
            figureClassName='h-full cursor-pointer'
            onClick={() => setOpenCCTVData({ open: true, item })}
          />
        </figure>
        <h4 className="camera-code">{item.camera_description}</h4>
        <p className="camera-location">{item.station_description}</p>
      </div>
    ))
  }, [data, isLoading, isError, setOpenCCTVData, randomCam])

  // Camera list — hidden on mobile, col 1 on desktop. Always exactly 3 items
  // sized via flex-1 to fill the column, so no scroll affordance is needed —
  // an overflow-y-auto here only ever fired from flexbox's own sub-pixel
  // rounding, showing a spurious scrollbar.
  return (
    <div className='flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:h-full'>
      {renderCCTVList}
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
