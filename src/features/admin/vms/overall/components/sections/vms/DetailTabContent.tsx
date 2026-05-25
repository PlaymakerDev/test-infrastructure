"use client"
import { Empty, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import React, { useState } from 'react'

const DetailTabContent: React.FC = () => {
  const [tabKey, setTabKey] = useState('1')

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'ทั้งหมด',
      children: <Empty description='ไม่มีข้อมูล' />,
    },
    {
      key: '2',
      label: 'ซ่อมแซมถนน',
      children: <Empty description='ไม่มีข้อมูล' />,
    },
    {
      key: '3',
      label: 'เทศกาล',
      children: <Empty description='ไม่มีข้อมูล' />,
    },
    {
      key: '4',
      label: 'แผ่นดินไหว',
      children: <Empty description='ไม่มีข้อมูล' />,
    },
  ]

  return (
    <Tabs
      defaultActiveKey={tabKey}
      items={items}
      onChange={(key) => setTabKey(key)}
      indicator={{ align: 'center' }}
    />
  )
}

export default React.memo(DetailTabContent)
