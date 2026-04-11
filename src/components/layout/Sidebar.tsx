"use client"
import React from 'react'
import { Drawer } from 'antd'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetDrawerOpen } from '@/stores/reducers/layout/layoutSlice'
import SidebarHeader from './sidebar/SidebarHeader'
import SidebarContent from './sidebar/SidebarContent'
import SidebarFooter from './sidebar/SidebarFooter'

interface Props {

}

const Sidebar: React.FC<Props> = (props) => {
  const { } = props
  const { drawer } = useAppSelector(state => state.layout)
  const { open } = drawer
  const dispatch = useAppDispatch()

  return (
    <aside>
      <Drawer
        title={<SidebarHeader />}
        open={open}
        onClose={() => dispatch(resetDrawerOpen())}
        placement='left'
        closable={false}
        footer={<SidebarFooter />}
      >
        <SidebarContent />
      </Drawer>
    </aside>
  )
}

export default React.memo<Props>(Sidebar)
