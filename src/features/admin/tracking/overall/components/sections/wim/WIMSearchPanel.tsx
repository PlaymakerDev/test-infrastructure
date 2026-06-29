import React, { useMemo } from 'react'
import { FormSearchWIM, WIMInfoCard } from '../../../components'
import { SumWim } from '@/types/tracking/overall-api'
import { Empty, Skeleton } from 'antd'

interface Props {
  data?: SumWim[]
  isLoading?: boolean
  isError?: boolean
  onSearch?: (value: string) => void
}

const StationSearchPanel: React.FC<Props> = (props) => {
  const { data, isLoading, isError, onSearch } = props

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <WIMInfoCard data={data} />
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

export default React.memo<Props>(StationSearchPanel)
