import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { Col, Row } from 'antd'
import React from 'react'

interface Props {}

const CAMERAS = [
  { name: '68SET-CCO4050-FAI012-จุดที่8-กม.10+550-ปุ่งหน้าปากน้ำโสภาคดี', ip: '10.12.7.3' },
  { name: '68FTD-NPM3015-FAI052-จุดที่26-กม.13+850-ปุ่งหน้าโรงเรียนบ้านน้ำเพิ่ม', ip: '10.12.2.1' },
]

const CameraList: React.FC<Props> = () => {
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
