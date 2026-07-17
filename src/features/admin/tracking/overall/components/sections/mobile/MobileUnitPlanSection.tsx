import React, { useMemo } from 'react'
import { TbCalendarWeekFilled } from "react-icons/tb";
import { ChartMobileUnitPlan, FormSearchUnitPlan } from '../../../components';
import { APIResponseTrackingViewSumPlanChart } from '@/types/tracking/overall-api';
import { Empty, Skeleton } from 'antd';

interface Props {
  data?: APIResponseTrackingViewSumPlanChart
  isLoading?: boolean
  isError?: boolean
}

const MobileUnitPlanSection: React.FC<Props> = (props) => {
  const { data, isLoading, isError } = props

  const renderChart = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <ChartMobileUnitPlan data={data} />
  }, [data, isLoading, isError])

  return (
    <div className='bg-black/50 rounded-lg p-5'>
      <section>
        <div className='flex items-center justify-between flex-wrap gap-3'>
          <div className='flex items-center gap-3 text-(--yellow)'>
            <TbCalendarWeekFilled className='fs-24' />
            <div>
              <h4 className='mb-0'>แผนงานและผลการจัดตั้งหน่วยชั่งเคลื่อนที่</h4>
              <p className='fs-12 text-white/50'>ประจำปีงบประมาณ 2569</p>
            </div>
          </div>
          <div className='w-full lg:max-w-xl'>
            <FormSearchUnitPlan />
          </div>
        </div>
      </section>
      <section className='mt-5'>
        {renderChart}
      </section>
    </div>
  )
}

export default React.memo<Props>(MobileUnitPlanSection)
