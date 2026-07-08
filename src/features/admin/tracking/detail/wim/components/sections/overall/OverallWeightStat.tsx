import React from 'react'
import { Col, Row } from 'antd'
import {
  CardCurrentWeightVehicle,
  CardDailyWeight,
  CardDailyOverweight
} from '@/features/admin/tracking/detail/wim/components'
import { WIMTodayStatsData } from '@/types/tracking/detail-api'

interface Props {
  wimToday?: WIMTodayStatsData
}

const OverallWeightStat: React.FC<Props> = (props) => {
  const { wimToday } = props

  return (
    <>
      <section>
        <CardCurrentWeightVehicle />
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
            <CardDailyWeight data={wimToday} />
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
            <CardDailyOverweight data={wimToday} />
          </Col>
        </Row>
      </section>
    </>
  )
}

export default React.memo<Props>(OverallWeightStat)
