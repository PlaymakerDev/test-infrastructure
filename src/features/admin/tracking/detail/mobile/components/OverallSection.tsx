import React from 'react'
import { Col, Row } from 'antd'
import {
  MobileDetailCard,
  MobileDetailImage,
  MobileStatCard,
  OverallDataDisplaySection
} from '../components'

interface Props {

}

const OverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <>
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={12} xxxl={12}>
            <MobileDetailCard />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={6} xxxl={6}>
            <MobileDetailImage />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={6} xxxl={6}>
            MAP
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <MobileStatCard />
      </section>
      <section className='mt-5'>
        <OverallDataDisplaySection />
      </section>
    </>
  )
}

export default React.memo<Props>(OverallSection)
