import React, { useMemo } from 'react'
import { FormSearchStation, StationInfoCard } from '../../../components'
import { SumStation } from '@/types/tracking/overall-api'
import { Empty, Skeleton } from 'antd'

interface Props {
  data?: SumStation[]
  isLoading?: boolean
  isError?: boolean
}

const StationSearchPanel: React.FC<Props> = (props) => {
  const { data, isLoading, isError } = props


  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <StationInfoCard data={data} />
  }, [isLoading, isError, data])

  return (
    <div>
      <section>
        <FormSearchStation />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(StationSearchPanel)
