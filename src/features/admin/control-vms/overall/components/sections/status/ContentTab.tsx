import { Empty, Skeleton, Tabs, TabsProps } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { SearchStatusSection, StatusTabContent } from '../../../components'
import { useVMSSettingStatusCount } from '../../../hooks/useVMSSettingStatusCount'

interface Props {

}

const ContentTab: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isError } = useVMSSettingStatusCount()

  const renderTabLabel = useCallback((statusName: string, count: number) => {
    return (
      <span className='flex items-center gap-2'>
        {statusName}
        <span className='inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded-full fs-12 font-medium bg-[#2A2A2A] text-white'>
          {count || 0}
        </span>
      </span>
    )
  }, [])

  const items: TabsProps['items'] = useMemo(() => {
    return [
      ...(data?.data ?? []).map((item) => ({
        key: String(item.status_id),
        label: renderTabLabel(item.status_name, item.count),
        children: <StatusTabContent item={item} />,
      }))
    ]
  }, [data?.data, renderTabLabel])

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <Tabs
      defaultActiveKey={String(data?.data?.[0]?.status_id ?? '')}
      items={items}
      indicator={{ align: 'center' }}
      destroyOnHidden
      tabBarExtraContent={{
        right: (
          <div className='hidden lg:block'>
            <SearchStatusSection />
          </div>
        )
      }}
    />
  )
}

export default React.memo<Props>(ContentTab)
