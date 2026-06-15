"use client"
import React, { useEffect } from 'react'
import { Drawer } from 'antd'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { getSidebarData, resetDrawerOpen } from '@/stores/reducers/layout/layoutSlice'
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
  const { task_schedules: { sidebar: { loading } } } = useAppSelector(state => state.layout)

  useEffect(() => {
    if (open) dispatch(getSidebarData())
  }, [open, dispatch])

  return (
    <aside>
      <Drawer
        title={<SidebarHeader />}
        open={open}
        onClose={() => dispatch(resetDrawerOpen())}
        placement='left'
        closable={false}
        footer={<SidebarFooter />}
        loading={loading}
      >
        <SidebarContent />
      </Drawer>
    </aside>
  )
}

export default React.memo<Props>(Sidebar)
