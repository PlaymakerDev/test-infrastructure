import React, { useMemo } from 'react'
import DisplayTitle from './DisplayTitle'
import DisplayTableList from './DisplayTableList'
import { Empty, Skeleton } from 'antd'
import { useControlVMSContext } from '../../../context'
import { useVMSSettingByRoad } from '../../../hooks/useVMSSettingByRoad'

interface Props {

}

const DataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const { searchText } = useControlVMSContext()

  const { data, isLoading, isError } = useVMSSettingByRoad(searchText?.road_code)

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <DisplayTableList data={data?.data} />
  }, [isLoading, isError, data])

  return (
    <>
      <section className='mt-5'>
        <DisplayTitle />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </>
  )
}

export default React.memo<Props>(DataDisplaySection)
