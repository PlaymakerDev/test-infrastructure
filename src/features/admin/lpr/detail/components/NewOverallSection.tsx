import { Col, Row } from 'antd'
import React from 'react'
import {
  ContentCard,
  ContentMap,
  TableDailyLicenseData,
  ContentChart,
  ContentLicenseDetail,
  DataDisplaySection
} from '../components'

interface Props {

}

const NewOverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='mt-5'>
      <section>
        <Row gutter={[16, 16]} align='stretch'>
          <Col xs={24} sm={24} md={24} lg={16} xl={18} xxl={18} xxxl={19}>
            <ContentMap />
          </Col>
          <Col xs={24} sm={24} md={24} lg={8} xl={6} xxl={6} xxxl={5}>
            <ContentCard />
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]} align='stretch'>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={9} xxxl={9}>
            <ContentChart />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={10} xxl={6} xxxl={6}>
            <ContentLicenseDetail />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={14} xxl={9} xxxl={9}>
            <TableDailyLicenseData />
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <DataDisplaySection />
      </section>
    </div>
  )
}

export default React.memo<Props>(NewOverallSection)
