import { Col, Row } from 'antd'
import React from 'react'

interface Props {

}

const OverallChartSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
        <p>CHART CONTENT</p>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
        <p>CHART CONTENT</p>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={6} xxxl={6}>
        <p>CHART CONTENT</p>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(OverallChartSection)
