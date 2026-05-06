import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { Col, Row } from 'antd'
import React, { useMemo } from 'react'

interface Props {

}

const mockCameras = [
  {
    id: 1,
    name: '67FTD-CMI3035-LPR002-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่',
    ip_address: '10.101.27.1',
  },
  {
    id: 2,
    name: '67FTD-CMI3035-LPR002-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่',
    ip_address: '10.101.27.2',
  },
  {
    id: 3,
    name: '67FTD-CMI3035-LPR002-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่',
    ip_address: '10.101.27.3',
  },
  {
    id: 4,
    name: '67FTD-CMI3035-LPR002-จุดที่11Wim-กม.7+580-มุ่งหน้า อ.เมืองเชียงใหม่',
    ip_address: '10.101.27.4',
  },
]

const OverallCCTV: React.FC<Props> = (props) => {
  const { } = props

  const renderCameraList = useMemo(() => {
    return mockCameras.map((item) => (
      <Col key={item.id} xs={24} sm={24} md={12} lg={12} xl={6} xxl={6} xxxl={6}>
        <HLSLivePlayer figureClassName='figure-small min-h-0 mb-1.5 rounded-lg' />
        <h4 className='fs-12 text-[#66AEFF] leading-snug break-all mb-0.5'>{item.name}</h4>
        <p className='fs-12 text-gray-400 leading-snug m-0'>IP Address : {item.ip_address}</p>
      </Col>
    ))
  }, [])

  return (
    <Row gutter={[16, 16]}>
      {renderCameraList}
    </Row>
  )
}

export default React.memo<Props>(OverallCCTV)
