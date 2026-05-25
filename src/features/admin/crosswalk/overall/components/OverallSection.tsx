import { Col, Row } from 'antd'
import React from 'react'
import { CCTVSection, DataDisplaySection, InfoCardSection, MapSection } from '../components'

interface Props {

}

const OverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <>
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={10}>
            <CCTVSection />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={14}>
            <MapSection />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={10}>
            <InfoCardSection />
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <DataDisplaySection />
      </section>
    </>
  )
}

export default React.memo<Props>(OverallSection)
