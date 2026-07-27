import { APIResponseSidebar } from '@/types/layout/api'
import { Tabs, type TabsProps } from 'antd'
import React from 'react'
import SidebarContent from './SidebarContent'
import SidebarSetting from './SidebarSetting'
import SidebarRoute from './SidebarRoute'
// import SidebarManagement from './SidebarManagement'

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
      key: 'ROUTE',
      label: 'สายทาง',
      children: <SidebarRoute />,
    },
    {
      key: 'SYSTEM_SETTINGS',
      label: 'การจัดการ',
      children: <SidebarSetting />,
    },
    // {
    //   key: 'MANAGEMENT',
    //   label: 'การจัดการ',
    //   children: <SidebarManagement />,
    // },
  ]

  return (
    <Tabs
      defaultActiveKey='DEPARTMENT'
      items={items}
      indicator={{ align: 'center' }}
      destroyOnHidden
      // Stretch the 3 tabs evenly across the full drawer width (each an equal
      // share, label centered within its own share) instead of AntD's default
      // left-hugging tab list — matches the design's edge-to-edge tab row.
      // Same `[&_.ant-tabs-*]` override technique as control-vms's ContentTab/
      // DetailTabContent. Colors (muted inactive, yellow active + ink bar)
      // already come from the global Tabs theme tokens — no override needed here.
      className='[&_.ant-tabs-nav-list]:w-full! [&_.ant-tabs-tab]:flex-1! [&_.ant-tabs-tab]:justify-center! [&_.ant-tabs-tab]:m-0!'
    />
  )
}

export default React.memo<Props>(SidebarTabContent)
