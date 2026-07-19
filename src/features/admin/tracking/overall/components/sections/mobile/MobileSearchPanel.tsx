import React, { useMemo } from 'react'
import { FormSearchMobile, MobileInfoCard } from '../../../components'
import { MobileMasterData, APIResponseTrackingViewSumPlanChart } from '@/types/tracking/overall-api'
import { Empty, Skeleton } from 'antd'
import { WIMMetaData } from '@/types/shared'
import { useMobileDailyCount } from '../../../hooks'
import dayjs from 'dayjs'

interface Props {
  data?: MobileMasterData[]
  meta?: WIMMetaData
  isLoading?: boolean
  isError?: boolean
  sumPlanData?: APIResponseTrackingViewSumPlanChart
  isSumPlanLoading?: boolean
  isSumPlanError?: boolean
}

const MobileSearchPanel: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isError } = useMobileDailyCount({
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  })

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <MobileInfoCard data={data?.data.data} />
  }, [isLoading, isError, data])

  return (
    <div>
      <section>
        <FormSearchMobile />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(MobileSearchPanel)
