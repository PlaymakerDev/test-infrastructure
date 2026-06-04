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
  OverallChartSection,
  ChartPreviousWeightVehicle,
  ChartTraffic,
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
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={14}>
            <section>
              <OverallMap />
            </section>
            <section className='mt-5'>
              <OverallCCTV />
            </section>
            <section className='mt-5'>
              <TableOverallWeight />
            </section>
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]} style={{ alignItems: 'stretch' }}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={10} className='flex flex-col'>
            <OverallAvgSpeed />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={7} className='flex flex-col'>
            <ChartPreviousWeightVehicle />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={7} className='flex flex-col'>
            <ChartTraffic />
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
