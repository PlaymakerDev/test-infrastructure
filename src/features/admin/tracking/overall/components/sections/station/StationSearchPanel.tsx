import React, { useMemo } from 'react'
import { FormSearchStation, StationInfoCard } from '../../../components'
import { Empty, Skeleton } from 'antd'
import { useStationDailyCount } from '../../../hooks'
import dayjs from 'dayjs'

interface Props {
  onSearch?: (value: string) => void
}

const StationSearchPanel: React.FC<Props> = (props) => {
  const { onSearch } = props

  const { data, isLoading, isError } = useStationDailyCount({
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  })

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <StationInfoCard data={data?.data.data} />
  }, [isLoading, isError, data])

  return (
    <div>
      <section>
        <FormSearchStation onSearch={onSearch} />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(StationSearchPanel)
