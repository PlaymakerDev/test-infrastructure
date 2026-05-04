import ReactMap from '@/components/map/ReactMap'
import { Col, Row } from 'antd'
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'

interface Props {

}

const LocationSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={6} lg={6} xl={6} xxl={6} xxxl={6}>
        <div>
          <figure className='figure-sm rounded-lg overflow-hidden'>
            <HLSLivePlayer />
          </figure>
          <h3 className='text-blue-400'>DRR-CCO-Weight-CAM01 (N) ขาออก ด่านชั่ง</h3>
          <p>สถานีด่านฯ ฉะเชิงเทรา</p>
        </div>
        <div>
          <figure className='figure-sm rounded-lg overflow-hidden'>
            <HLSLivePlayer />
          </figure>
          <h3 className='text-blue-400'>DRR-CCO-Weight-CAM01 (N) ขาออก ด่านชั่ง</h3>
          <p>สถานีด่านฯ ฉะเชิงเทรา</p>
        </div>
        <div>
          <figure className='figure-sm rounded-lg overflow-hidden'>
            <HLSLivePlayer />
          </figure>
          <h3 className='text-blue-400'>DRR-CCO-Weight-CAM01 (N) ขาออก ด่านชั่ง</h3>
          <p>สถานีด่านฯ ฉะเชิงเทรา</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={18} lg={18} xl={18} xxl={18} xxxl={18}>
        <ReactMap />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(LocationSection)
