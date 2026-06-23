"use client"
import { Empty, Skeleton, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import React, { useMemo } from 'react'
import { ContentSetting } from '../../../components'
import { useVMSSettingTypes } from '../../../hooks/useVMSSettingTypes'

const DetailTabContent: React.FC = () => {
  const { data, isLoading, isError } = useVMSSettingTypes()

  const items: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: 'all',
        label: 'ทั้งหมด',
        children: <ContentSetting settingTypeId={undefined} />,
      },
      ...(data?.data ?? []).map((item) => ({
        key: String(item.id),
        label: item.name,
        children: <ContentSetting settingTypeId={item.id} />,
      }))
    ]
  }, [data?.data])

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <Tabs
      defaultActiveKey='all'
      items={items}
      indicator={{ align: 'center' }}
      destroyOnHidden
    />
  )
}

export default React.memo(DetailTabContent)
