import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { Col, Row } from 'antd'
import React from 'react'

interface Props {

}

const ContentCCTV: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
        <div className='p-5 bg-(--mid-gray) rounded-2xl h-full'>
          <HLSLivePlayer
            enableViewportPause
            figureClassName='figure-normal min-h-0 overflow-hidden rounded-lg'
          />
          <section className='mt-3'>
            <h4 className='text-(--default-blue) font-normal!'>69MST-SBR2006-LPR001-จุดที่1-กม.0+500-มุ่งหน้าทางหลวง หมายเลข 32</h4>
            <p className='text-white/50 fs-12'>IP Address : 11.0.16.101</p>
          </section>
        </div>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
        <div className='p-5 bg-(--mid-gray) rounded-2xl h-full'>
          <HLSLivePlayer
            enableViewportPause
            figureClassName='figure-normal min-h-0 overflow-hidden rounded-lg'
          />
          <section className='mt-3'>
            <h4 className='text-(--default-blue) font-normal!'>69MST-SBR2006-LPR001-จุดที่1-กม.0+500-มุ่งหน้าทางหลวง หมายเลข 32</h4>
            <p className='text-white/50 fs-12'>IP Address : 11.0.16.101</p>
          </section>
        </div>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
        <div className='p-5 bg-(--mid-gray) rounded-2xl h-full'>
          <HLSLivePlayer
            enableViewportPause
            figureClassName='figure-normal min-h-0 overflow-hidden rounded-lg'
          />
          <section className='mt-3'>
            <h4 className='text-(--default-blue) font-normal!'>69MST-SBR2006-LPR001-จุดที่1-กม.0+500-มุ่งหน้าทางหลวง หมายเลข 32</h4>
            <p className='text-white/50 fs-12'>IP Address : 11.0.16.101</p>
          </section>
        </div>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
        <div className='p-5 bg-(--mid-gray) rounded-2xl h-full'>
          <HLSLivePlayer
            enableViewportPause
            figureClassName='figure-normal min-h-0 overflow-hidden rounded-lg'
          />
          <section className='mt-3'>
            <h4 className='text-(--default-blue) font-normal!'>69MST-SBR2006-LPR001-จุดที่1-กม.0+500-มุ่งหน้าทางหลวง หมายเลข 32</h4>
            <p className='text-white/50 fs-12'>IP Address : 11.0.16.101</p>
          </section>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ContentCCTV)
