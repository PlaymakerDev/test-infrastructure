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
} from '../components'

interface Props {

}

const OverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <>
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
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
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
            <p>CONTENT</p>
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <h3 className='text-(--yellow)'>ตารางข้อมูลรถเข้าชั่งน้ำหนักวันนี้</h3>
        <p>CONTENT</p>
      </section>
    </>
  )
}

export default React.memo<Props>(OverallSection)
