import React from 'react'
import { Col, Row } from 'antd'
import {
  CardCurrentWeightVehicle,
  CardDailyWeight,
  CardDailyOverweight
} from '@/features/admin/tracking/detail/wim/components'
import type { NormalizedDailyLog } from '@/features/admin/tracking/detail/wim/hooks'

interface Props {
  dailyLog?: NormalizedDailyLog
}

const OverallWeightStat: React.FC<Props> = (props) => {
  const { dailyLog } = props

  return (
    <>
      <section>
        <CardCurrentWeightVehicle />
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
            <CardDailyWeight data={dailyLog} />
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
            <CardDailyOverweight data={dailyLog} />
          </Col>
        </Row>
      </section>
    </>
  )
}

export default React.memo<Props>(OverallWeightStat)
