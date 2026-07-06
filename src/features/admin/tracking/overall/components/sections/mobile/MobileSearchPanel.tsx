import React, { useMemo } from 'react'
import { FormSearchMobile, MobileInfoCard } from '../../../components'
import { SumMobile } from '@/types/tracking/overall-api'
import { Empty, Skeleton } from 'antd'

interface Props {
  data?: SumMobile[]
  isLoading?: boolean
  isError?: boolean
  onSearch?: (value: string) => void
}

const MobileSearchPanel: React.FC<Props> = (props) => {
  const { data, isLoading, isError, onSearch } = props

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <MobileInfoCard data={data} />
  }, [isLoading, isError, data])

  return (
    <div>
      <section>
        <FormSearchMobile onSearch={onSearch} />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(MobileSearchPanel)
