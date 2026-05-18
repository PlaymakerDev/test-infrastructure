import React from 'react'
import { Col, Row } from 'antd'
import {
  VehicleOnRouteSection,
  VehicleDetailSection
} from '../components'

interface Props {

}

const OverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='px-10'>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={12}>
          <VehicleOnRouteSection />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={12}>
          <VehicleDetailSection />
        </Col>
      </Row>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
