import React, { useMemo } from 'react'
import { FormSearchWIM, WIMInfoCard } from '../../../components'
import { Empty, Skeleton } from 'antd'
import { getTrackingSumWIMAPI } from '@/services/routes/TrackingService'
import { useQuery } from '@tanstack/react-query'
import { getTrackingWIMDailyCountAPI } from '@/services/routes/TrackingDetailService'
import dayjs from 'dayjs'

interface Props {
  onSearch?: (value: string) => void
}

const WIMSearchPanel: React.FC<Props> = (props) => {
  const { onSearch } = props

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking_overall_wim_daily_status_count'],
    queryFn: () => getTrackingWIMDailyCountAPI({
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD')
    }),
  })

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <WIMInfoCard data={data?.data.data} />
  }, [isLoading, isError, data])

  return (
    <div>
      <section>
        <FormSearchWIM onSearch={onSearch} />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(WIMSearchPanel)
