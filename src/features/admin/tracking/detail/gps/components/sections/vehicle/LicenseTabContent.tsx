"use client"
import { Tabs } from 'antd'
import type { TabsProps } from 'antd'
import React from 'react'
import { VehicleList } from '@/components/list'
import type { VehicleItem } from '@/components/list'
import { VehicleLocationData } from '@/types/tracking/detail-gps-api'
import { useGPSContext } from '../../../context'

interface Props {
  data?: VehicleLocationData
}

const MOCK_VEHICLES: VehicleItem[] = [
  { id: 1, license: '84-7398', province: 'สระบุรี', speed: 84, weightStatus: 'normal', moveStatus: 'moving' },
  { id: 2, license: '70-4724', province: 'หนองคาย', speed: 54, weightStatus: 'normal', moveStatus: 'moving' },
  { id: 3, license: '82-2712', province: 'เพชรบูรณ์', speed: 36, weightStatus: 'overweight', moveStatus: 'moving' },
  { id: 4, license: '70-4724', province: 'หนองคาย', speed: 0, weightStatus: 'within_limit', moveStatus: 'parked' },
  { id: 5, license: '70-0894', province: 'นครนายก', speed: 0, weightStatus: 'overweight', moveStatus: 'parked' },
]

const LicenseTabContent: React.FC<Props> = (props) => {
  const { data } = props
  const { licenseTab, setLicenseTab, setVehicleDetail } = useGPSContext()

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'ทั้งหมด',
      children: <VehicleList items={data?.car_list || []} onSelect={(item) => setVehicleDetail({ open: true, unit_id: item.unit_id })} />,
    },
    {
      key: '2',
      label: 'รถเคลื่อนที่',
      children: <VehicleList items={(data?.car_list || []).filter((v) => v.speed > 0)} onSelect={(item) => setVehicleDetail({ open: true, unit_id: item.unit_id })} />,
    },
    {
      key: '3',
      label: 'รถจอด',
      children: <VehicleList items={(data?.car_list || []).filter((v) => v.speed === 0)} onSelect={(item) => setVehicleDetail({ open: true, unit_id: item.unit_id })} />,
    },
    {
      key: '4',
      label: 'รถน้ำหนักเกิน',
      children: <VehicleList items={(data?.car_list || []).filter((v) => v.isoverweight === "Y")} onSelect={(item) => setVehicleDetail({ open: true, unit_id: item.unit_id })} />,
    },
  ]

  return (
    <Tabs
      activeKey={licenseTab}
      items={items}
      onChange={(key) => setLicenseTab(key)}
      indicator={{ align: 'center' }}
    />
  )
}

export default React.memo(LicenseTabContent)
