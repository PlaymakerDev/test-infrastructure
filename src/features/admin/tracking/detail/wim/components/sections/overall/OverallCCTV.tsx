import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useCctvList } from '@/features/admin/tracking/detail/wim/hooks'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { Col, Row } from 'antd'
import React, { useMemo, useState } from 'react'
import QueryBoundary from '@/components/common/QueryBoundary'

interface Props {
  stationId: string[] | string | number | undefined;
  stationType: number | null | undefined;
}

const OverallCCTV: React.FC<Props> = (props) => {
  const { stationId, stationType } = props
  const dispatch = useAppDispatch()
  const [randomCam] = useState(() => `${Math.random()}`);

  const { data, isLoading, isError } = useCctvList({
    station_id: stationId as string,
    station_type_id: stationType as number,
    page: 1,
    page_size: 100
  })

  const renderCCTVList = useMemo(() => {
    const randomCCTV = data?.data?.data?.filter(item => item.camera_status === 'Online')?.sort(() => Number(randomCam) - 0.5).slice(0, 4)
    return randomCCTV?.map((item) => (
      <Col key={item.id} xs={24} sm={24} md={12} lg={12} xl={6} xxl={6} xxxl={6}>
        <figure className='flex-1 min-h-0 rounded-lg overflow-hidden mb-1.5'>
          <HLSLivePlayer
            cameraId={String(item.id)}
            hlsUrl={item.stream_url}
            enableViewportPause
            figureClassName='figure-normal lg:h-50! lg:min-h-0! lg:max-h-none! mb-1.5 rounded-lg cursor-pointer'
            onClick={() => dispatch(setCCTVModalOpen({ open: true, camera_id: item.id }))}
          />
        </figure>
        <h4 className='fs-12 text-[#66AEFF] leading-snug break-all mb-0.5'>{item.camera_description}</h4>
        <p className='fs-12 text-gray-400 leading-snug m-0'>IP Address : {item.station_description}</p>
      </Col>
    ))
  }, [data, dispatch, randomCam])

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
