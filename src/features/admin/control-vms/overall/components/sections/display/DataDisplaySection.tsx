import React, { useMemo, useState } from 'react'
import DisplayTitle from './DisplayTitle'
import DisplayTableList from './DisplayTableList'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getVMSSettingByRoadAPI } from '@/services/routes/ControlVMSService'
import { Empty, Skeleton } from 'antd'
import { APIRequestVMSSettingByRoad } from '@/types/control-vms/display-api'
import { useControlVMSContext } from '../../../context'

interface Props {

}

const DataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const { searchText } = useControlVMSContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vms_setting_by_road', searchText?.road_code],
    queryFn: () => getVMSSettingByRoadAPI({
      road_code: searchText?.road_code
    }),
    placeholderData: keepPreviousData
  })

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
