import React, { useMemo } from 'react'
import { FormSearchCalendar, ScheduleSection } from '../../../components'
import { useControlVMSContext } from '../../../context'
import { Empty, Skeleton } from 'antd'
import { useVMSSchedule } from '../../../hooks/useVMSSchedule'

interface Props {

}

const ScheduleDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const { searchDate } = useControlVMSContext()

  const { data, isLoading, isError } = useVMSSchedule(searchDate?.month, searchDate?.year)

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <ScheduleSection data={data?.data} />
  }, [isLoading, isError, data])

  return (
    <>
      <section>
        <FormSearchCalendar />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </>
  )
}

export default React.memo<Props>(ScheduleDisplaySection)
