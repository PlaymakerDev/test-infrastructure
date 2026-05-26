import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { Col, Row } from 'antd'
import React from 'react'

interface Props {

}

const CAMERAS = [
  { name: '67FTD-SPK2001-F002จุดที่2-กม.1+020-มุ่งหน้าบางบา-ตราด', ip: '10.101.27.1' },
  { name: '67FTD-SPK2001-F003-จุดที่2-กม.1+020-มุ่งหน้าลาดกระบัง', ip: '10.101.27.2' },
  { name: '67FTD-SPK2001-F005-จุดที่2-กม.1+020-มุ่งหน้าบางบา-ตราด', ip: '10.101.27.3' },
  { name: '67FTD-SPK2001-F004-จุดที่2-กม.1+020-มุ่งหน้าลาดกระบัง', ip: '10.101.27.4' },
]

const CameraList: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      {CAMERAS.map((camera, index) => (
        <Col key={index} xs={24} sm={24} md={12} lg={12} xl={12} xxl={6} xxxl={6}>
          <div className='flex-1 min-h-0 flex flex-col'>
            <HLSLivePlayer figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg' />
            <h4 className='text-blue-500'>{camera.name}</h4>
            <p className='camera-location'>IP Address : {camera.ip}</p>
          </div>
        </Col>
      ))}
    </Row>
  )
}

export default React.memo<Props>(CameraList)
