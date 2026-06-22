"use client"
import { getVMSSettingTypeAPI } from '@/services/routes/ControlVMSService'
import { useQuery } from '@tanstack/react-query'
import { Empty, Skeleton, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { ContentSetting } from '../../../components'
import { useAppDispatch } from '@/stores/hooks'
import { setVMSMediaType } from '@/stores/reducers/control-vms/controlVMSSlice'

const DetailTabContent: React.FC = () => {
  const [tabKey, setTabKey] = useState('0')
  const dispatch = useAppDispatch()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['setting_type'],
    queryFn: () => getVMSSettingTypeAPI(),
  })

  useEffect(() => {
    if (!isLoading && !isError && data?.data.length) {
      dispatch(setVMSMediaType(data.data))
    }
  }, [isLoading, isError, data, dispatch])

  const items: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: '0',
        label: 'ทั้งหมด',
        children: <ContentSetting tabKey={tabKey} />,
      },
      ...(data?.data || []).map((item, index) => ({
        key: String(index + 1),
        label: item.name,
        children: <ContentSetting tabKey={tabKey} />,
      }))
    ]
  }, [data?.data, tabKey])

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <Tabs
        defaultActiveKey={tabKey}
        items={items}
        onChange={(key) => setTabKey(key)}
        indicator={{ align: 'center' }}
        destroyOnHidden
      />)
  }, [
    isLoading,
    isError,
    items,
    tabKey
  ])

  return renderContent
}

export default React.memo(DetailTabContent)
