"use client"
import React, { useMemo } from 'react'
import { Drawer, Empty, Skeleton } from 'antd'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetDrawerOpen } from '@/stores/reducers/layout/layoutSlice'
import SidebarHeader from './sidebar/SidebarHeader'
import SidebarContent from './sidebar/SidebarContent'
import SidebarFooter from './sidebar/SidebarFooter'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getSidebarAPI } from '@/services/routes/LayoutService'

interface Props {

}

const Sidebar: React.FC<Props> = (props) => {
  const { } = props
  const { drawer } = useAppSelector(state => state.layout)
  const { open } = drawer
  const dispatch = useAppDispatch()
  // const { task_schedules: { sidebar: { loading } } } = useAppSelector(state => state.layout)

  // useEffect(() => {
  //   if (open) dispatch(getSidebarData())
  // }, [open, dispatch])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sidebar_data'],
    queryFn: () => getSidebarAPI(),
    enabled: !!open,
    placeholderData: keepPreviousData
  })

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description='ไม่สามารถโหลดข้อมูลได้' />
    return <SidebarContent data={data?.data} />
  }, [data, isLoading, isError])

  return (
    <aside>
      <Drawer
        title={<SidebarHeader />}
        open={open}
        onClose={() => dispatch(resetDrawerOpen())}
        placement='left'
        closable={false}
        footer={<SidebarFooter />}
        loading={isLoading}
      >
        {renderContent}
      </Drawer>
    </aside>
  )
}

export default React.memo<Props>(Sidebar)
