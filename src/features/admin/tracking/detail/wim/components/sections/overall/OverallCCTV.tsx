import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { getTrackingCCTVListAPI } from '@/services/routes/TrackingService'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useQuery } from '@tanstack/react-query'
import { Col, Empty, Row, Skeleton } from 'antd'
import React, { useMemo, useState } from 'react'

interface Props {
  stationId: string[] | string | number | undefined;
  stationType: number | null | undefined;
}

// const mockCameras = [
//   {
//     id: 1,
//     name: '67FTD-CMI3035-LPR002-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่',
//     ip_address: '10.101.27.1',
//   },
//   {
//     id: 2,
//     name: '67FTD-CMI3035-LPR002-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่',
//     ip_address: '10.101.27.2',
//   },
//   {
//     id: 3,
//     name: '67FTD-CMI3035-LPR002-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่',
//     ip_address: '10.101.27.3',
//   },
//   {
//     id: 4,
//     name: '67FTD-CMI3035-LPR002-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่',
//     ip_address: '10.101.27.4',
//   },
// ]

const OverallCCTV: React.FC<Props> = (props) => {
  const { stationId, stationType } = props
  const dispatch = useAppDispatch()
  const [randomCam] = useState(() => `${Math.random()}`);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking_cctv_list', stationId, stationType],
    queryFn: () => getTrackingCCTVListAPI({
      station_id: stationId as string,
      station_type_id: stationType as number,
      page: 1,
      page_size: 100
    }),
    enabled: !!stationId,
  })

  const renderCCTVList = useMemo(() => {
    // RENDER COMPONENT LOADING
    if (isLoading) {
      return Array.from({ length: 4 }).map((_, index) => {
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
  }, [data, isLoading, isError, dispatch, randomCam])

  return (
    <Row gutter={[16, 16]}>
      {renderCCTVList}
    </Row>
  )
}

export default React.memo<Props>(OverallCCTV)
