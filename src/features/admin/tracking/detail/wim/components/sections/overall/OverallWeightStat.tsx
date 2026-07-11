import React, { useMemo } from 'react'
import { Col, Empty, Row, Skeleton } from 'antd'
import {
  CardCurrentWeightVehicle,
  CardDailyWeight,
  CardDailyOverweight
} from '@/features/admin/tracking/detail/wim/components'
import { useCurrentWeightVehicle } from '@/features/admin/tracking/detail/wim/hooks'
import type { NormalizedDailyLog } from '@/features/admin/tracking/detail/wim/hooks'

interface Props {
  stationId: string[] | string | number | undefined;
  stationType: string | null | undefined;
  stationTypeId: number | null | undefined;
  dailyLog?: NormalizedDailyLog
}

const OverallWeightStat: React.FC<Props> = (props) => {
  const { stationId, stationType, stationTypeId, dailyLog } = props

  const {
    data: currentVehicleLog,
    isLoading: isCurrentVehicleLoading,
    isError: isCurrentVehicleError,
  } = useCurrentWeightVehicle(stationId as string | number | undefined, stationType, stationTypeId)

  const renderCurrentWeightVehicle = useMemo(() => {
    if (isCurrentVehicleLoading) return <Skeleton loading={isCurrentVehicleLoading} active paragraph={{ rows: 10 }} />
    if (isCurrentVehicleError) return <Empty description='ไม่สามารถโหลดข้อมูลได้' />
    return <CardCurrentWeightVehicle data={currentVehicleLog?.data?.data} />
  }, [isCurrentVehicleLoading, isCurrentVehicleError, currentVehicleLog?.data?.data])

  return (
    <>
      <section>
        {renderCurrentWeightVehicle}
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
