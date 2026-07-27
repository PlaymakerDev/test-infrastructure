import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useCctvList } from '@/features/admin/tracking/detail/wim/hooks'
import { Col, Empty, Row } from 'antd'
import React, { useMemo, useState } from 'react'
import QueryBoundary from '@/components/common/QueryBoundary'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'

interface Props {

}

// Cheap discovery page — small enough to learn `meta.total` without paying for
// a large payload up front. When the real total exceeds it, a second request
// fetches everything in one shot so "online" filtering covers every camera,
// not just whatever fit on page 1.
const DISCOVERY_PAGE_SIZE = 10

const OverallCCTV: React.FC<Props> = () => {
  const { id: stationId, stationTypeId, setOpenCCTVData } = useWIMContext()
  const [randomCam] = useState(() => `${Math.random()}`);

  const { data: firstPage, isLoading: isFirstLoading, isError: isFirstError } = useCctvList({
    station_id: stationId as string,
    station_type_id: stationTypeId as number,
    page: 1,
    page_size: DISCOVERY_PAGE_SIZE
  })

  const total = firstPage?.data?.meta?.total ?? 0
  const hasMore = total > DISCOVERY_PAGE_SIZE

  const { data: allPages, isLoading: isAllLoading, isError: isAllError } = useCctvList(
    {
      station_id: stationId as string,
      station_type_id: stationTypeId as number,
      page: 1,
      page_size: total
    },
    hasMore
  )

  const data = hasMore ? allPages : firstPage
  const isLoading = isFirstLoading || (hasMore && isAllLoading)
  const isError = isFirstError || (hasMore && isAllError)

  const renderCCTVList = useMemo(() => {
    const randomCCTV = data?.data?.data?.filter(item => item.camera_status === 'Online')?.sort(() => Number(randomCam) - 0.5).slice(0, 4)

    if (!randomCCTV || randomCCTV.length === 0) {
      return (
        <figure className='block mx-auto my-28'>
          <Empty description="ไม่พบข้อมูล CCTV ในช่วงเวลานี้" />
        </figure>
      )
    }

    return randomCCTV?.map((item) => (
      <Col key={item.id} xs={24} sm={24} md={12} lg={12} xl={6} xxl={6} xxxl={6}>
        <figure className='flex-1 min-h-0 rounded-lg overflow-hidden mb-1.5'>
          <HLSLivePlayer
            cameraId={String(item.id)}
            hlsUrl={item.stream_url}
            enableViewportPause
            figureClassName='figure-normal lg:h-50! lg:min-h-0! lg:max-h-none! mb-1.5 rounded-lg cursor-pointer'
            onClick={() => setOpenCCTVData({ open: true, item: item ?? null })}
          />
        </figure>
        <h4 className='fs-12 text-(--default-blue) leading-snug break-all mb-0.5'>{item.camera_description || '-'}</h4>
        <p className='fs-12 text-white/50 leading-snug m-0'>IP Address : {item.camera_ip || '-'}</p>
      </Col>
    ))
  }, [data, randomCam, setOpenCCTVData])

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      skeletonRows={5}
    >
      <Row gutter={[16, 16]}>
        {renderCCTVList}
      </Row>
    </QueryBoundary>
  )
}

export default React.memo<Props>(OverallCCTV)
