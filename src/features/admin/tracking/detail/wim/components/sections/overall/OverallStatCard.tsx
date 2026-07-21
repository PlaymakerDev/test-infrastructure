import type { PCUData } from '@/types/tracking/detail-api'
import type { NormalizedDailyLog } from '@/features/admin/tracking/detail/wim/hooks'
import { fmtNumber } from '@/utils/formatNumber'
import { Col, Row } from 'antd'
import React from 'react'
import { TbBox, TbCar, TbTruck } from 'react-icons/tb'
import QueryBoundary from '@/components/common/QueryBoundary'

interface Props {
  pcu?: PCUData
  dailyLog?: NormalizedDailyLog
  isDailyLogLoading: boolean
  isDailyLogError: boolean
}

const OverallStatCard: React.FC<Props> = (props) => {
  const { pcu, dailyLog, isDailyLogLoading, isDailyLogError } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
        <div className="bg-[#FCD1161A] border-2 rounded-2xl p-5 border-(--yellow)">
          <TbTruck className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>AADT</h3>
          <p><span className='fs-24 font-bold'>{fmtNumber(Number(pcu?.aadt)) || 0}</span> คัน</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
        <div className="bg-[#FCD1161A] border-2 rounded-2xl p-5 border-(--yellow)">
          <TbCar className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>PCU Average</h3>
          <p><span className='fs-24 font-bold'>{fmtNumber(Number(pcu?.total_pcu)) || 0}</span> คัน</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
        <QueryBoundary isLoading={isDailyLogLoading} isError={isDailyLogError}>
          <div className="bg-[#FCD1161A] border-2 rounded-2xl p-5 border-(--yellow)">
            <TbBox className='fs-24 text-(--yellow) mb-1' />
            <h3 className='text-(--yellow)'>รถน้ำหนักเกิน 10%</h3>
            <p><span className='fs-24 font-bold'>{fmtNumber(dailyLog?.meta.summary.is_over_10_percent || 0)}</span> คัน</p>
          </div>
        </QueryBoundary>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(OverallStatCard)
