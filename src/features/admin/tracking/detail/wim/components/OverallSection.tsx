import React from 'react'
import { Col, Row } from 'antd'
import {
  // LEFT COLUMN
  OverallWeightStat,
  OverallStatCard,
  OverallCalibrateWeight,
  OverallAvgSpeed,
  // RIGHT COLUMN
  OverallMap,
  OverallCCTV,
  TableOverallWeight,
  // LOWER SECTION
  OverallDailyWeightList,
  TableOverallDailyWeight,
  OverallDataDisplaySection,
} from '../components'

interface Props {

}

const OverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <>
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={10}>
            <section>
              <OverallWeightStat />
            </section>
            <section className='mt-5'>
              <OverallStatCard />
            </section>
            <section className='mt-5'>
              <OverallCalibrateWeight />
            </section>
            <section className='mt-5'>
              <OverallAvgSpeed />
            </section>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={14}>
            <section>
              <p>MAP CONTENT</p>
            </section>
            <section className='mt-5'>
              <OverallCCTV />
            </section>
            <section className='mt-5'>
              <TableOverallWeight />
            </section>
            <section className='mt-5'>
              <p>CONTEXT</p>
            </section>
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <OverallDataDisplaySection />
      </section>
    </>
  )
}

export default React.memo<Props>(OverallSection)
