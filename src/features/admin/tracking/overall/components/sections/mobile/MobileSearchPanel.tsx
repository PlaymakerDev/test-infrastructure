import React, { useMemo } from 'react'
import { FormSearchMobile, MobileInfoCard } from '../../../components'
import { MobileMasterData } from '@/types/tracking/overall-api'
import { Empty, Skeleton } from 'antd'
import { WIMMetaData } from '@/types/shared'

interface Props {
  data?: MobileMasterData[]
  meta?: WIMMetaData
  isLoading?: boolean
  isError?: boolean
}

const MobileSearchPanel: React.FC<Props> = (props) => {
  const { data, meta, isLoading, isError } = props

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <MobileInfoCard data={data} meta={meta} />
  }, [isLoading, isError, data, meta])

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
