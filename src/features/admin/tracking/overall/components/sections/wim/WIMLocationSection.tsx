"use client"
import React from 'react'
import { WIMCCTVList, WIMMap, WIMSearchPanel } from '@/features/admin/tracking/overall/components'
import { Col, Row } from 'antd'

const WIMLocationSection = () => {

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={12} xl={8} xxl={6} xxxl={6}>
          <WIMCCTVList />
        </Col>
        <Col xs={24} sm={24} md={24} lg={12} xl={16} xxl={12} xxxl={12}>
          <WIMMap />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={6} xxxl={6}>
          <WIMSearchPanel />
        </Col>
      </Row>
    </div>
  )
}

export default React.memo(WIMLocationSection)
