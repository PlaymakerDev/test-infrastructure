"use client"
import { Tabs } from 'antd'
import type { TabsProps } from 'antd'
import React, { useState } from 'react'
import { VehicleList } from '@/components/list'
import type { VehicleItem } from '@/components/list'

const MOCK_VEHICLES: VehicleItem[] = [
  { id: 1, license: '84-7398', province: 'สระบุรี',    speed: 84, weightStatus: 'normal',       moveStatus: 'moving' },
  { id: 2, license: '70-4724', province: 'หนองคาย',   speed: 54, weightStatus: 'normal',       moveStatus: 'moving' },
  { id: 3, license: '82-2712', province: 'เพชรบูรณ์', speed: 36, weightStatus: 'overweight',   moveStatus: 'moving' },
  { id: 4, license: '70-4724', province: 'หนองคาย',   speed: 0,  weightStatus: 'within_limit', moveStatus: 'parked' },
  { id: 5, license: '70-0894', province: 'นครนายก',   speed: 0,  weightStatus: 'overweight',   moveStatus: 'parked' },
]

const LicenseTabContent: React.FC = () => {
  const [tabKey, setTabKey] = useState('1')

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'ทั้งหมด',
      children: <VehicleList items={MOCK_VEHICLES} />,
    },
    {
      key: '2',
      label: 'รถเคลื่อนที่',
      children: <VehicleList items={MOCK_VEHICLES.filter((v) => v.moveStatus === 'moving')} />,
    },
    {
      key: '3',
      label: 'รถจอด',
      children: <VehicleList items={MOCK_VEHICLES.filter((v) => v.moveStatus === 'parked')} />,
    },
    {
      key: '4',
      label: 'รถน้ำหนักเกิน',
      children: <VehicleList items={MOCK_VEHICLES.filter((v) => v.weightStatus === 'overweight')} />,
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

export default React.memo(LicenseTabContent)
