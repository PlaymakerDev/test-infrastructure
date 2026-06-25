import FeatureSectionLayout from '@/components/section/FeatureSectionLayout'
import { Col, Row } from 'antd'
import React from 'react'
import { MobileDetailCard, MobileDetailImage, MobileDetailMap, MobileStatCard, OverallDataDisplaySection } from '../components'

const MobileTopGrid: React.FC = () => (
  <Row gutter={[16, 16]}>
    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={12} xxxl={12}>
      <MobileDetailCard />
    </Col>
    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={6} xxxl={6}>
      <MobileDetailImage />
    </Col>
    <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={6} xxxl={6}>
      <MobileDetailMap />
    </Col>
  </Row>
)

const OverallSection: React.FC = () => (
  <FeatureSectionLayout
    top={<MobileTopGrid />}
    middle={<MobileStatCard />}
    bottom={<OverallDataDisplaySection />}
  />
)

export default React.memo(OverallSection)
