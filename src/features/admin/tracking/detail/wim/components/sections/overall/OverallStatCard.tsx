import { PCUData, WIMTodayStatsData } from '@/types/tracking/detail-api'
import { fmtNumber } from '@/utils/formatNumber'
import { Col, Empty, Row, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { TbBox, TbCar, TbTruck } from 'react-icons/tb'

interface Props {
  pcu?: PCUData
  wimToday?: WIMTodayStatsData
  isWimTodayLoading: boolean
  isWimTodayError: boolean
}

const OverallStatCard: React.FC<Props> = (props) => {
  const { pcu, wimToday, isWimTodayLoading, isWimTodayError } = props

  const renderOver10Percent = useMemo(() => {
    if (isWimTodayLoading) return <Skeleton active paragraph={{ rows: 4 }} />
    if (isWimTodayError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <div className="bg-[#FCD1161A] border-2 rounded-lg p-5 border-(--yellow)">
        <TbBox className='fs-24 text-(--yellow) mb-1' />
        <h3 className='text-(--yellow)'>รถน้ำหนักเกิน 10%</h3>
        <p><span className='fs-24 font-bold'>{fmtNumber(wimToday?.over_10percent) || 0}</span> คัน</p>
      </div>
    )
  }, [isWimTodayLoading, isWimTodayError, wimToday])

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
        <div className="bg-[#FCD1161A] border-2 rounded-lg p-5 border-(--yellow)">
          <TbTruck className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>AADT</h3>
          <p><span className='fs-24 font-bold'>{fmtNumber(Number(pcu?.aadt)) || 0}</span> คัน</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
        <div className="bg-[#FCD1161A] border-2 rounded-lg p-5 border-(--yellow)">
          <TbCar className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>PCU Average</h3>
          <p><span className='fs-24 font-bold'>{fmtNumber(Number(pcu?.total_pcu)) || 0}</span> คัน</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
        {renderOver10Percent}
      </Col>
    </Row>
  )
}

export default React.memo<Props>(OverallStatCard)
