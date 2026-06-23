import { APIResponseSidebar } from '@/types/layout/api'
import { Tabs, type TabsProps } from 'antd'
import React from 'react'
import SidebarContent from './SidebarContent'
import SidebarSetting from './SidebarSetting'
import SidebarManagement from './SidebarManagement'

interface Props {
  data?: APIResponseSidebar
}

const SidebarTabContent: React.FC<Props> = (props) => {
  const { data } = props

  const items: TabsProps['items'] = [
    {
      key: 'DEPARTMENT',
      label: 'สำนัก',
      children: <SidebarContent data={data} />,
    },
    {
      key: 'SYSTEM_SETTINGS',
      label: 'ตั้งค่าระบบ',
      children: <SidebarSetting />,
    },
    {
      key: 'MANAGEMENT',
      label: 'การจัดการ',
      children: <SidebarManagement />,
    },
  ]

  return (
    <Tabs
      defaultActiveKey='DEPARTMENT'
      items={items}
      indicator={{ align: 'center' }}
      destroyOnHidden
    />
  )
}

export default React.memo<Props>(SidebarTabContent)
