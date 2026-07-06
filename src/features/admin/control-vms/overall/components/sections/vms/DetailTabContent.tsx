"use client"
import { Button, Empty, Skeleton, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import React, { useMemo } from 'react'
import { ContentSetting } from '../../../components'
import { useVMSSettingTypes } from '../../../hooks/useVMSSettingTypes'
import { useControlVMSContext } from '../../../context'

const DetailTabContent: React.FC = () => {
  const { data, isLoading, isError } = useVMSSettingTypes()
  const { setOpenUpdateType } = useControlVMSContext()

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
      tabBarExtraContent={{
        right: <Button htmlType='button' type='primary' onClick={() => setOpenUpdateType({ open: true })}>จัดการประเภท</Button>
      }}
    />
  )
}

export default React.memo(DetailTabContent)
