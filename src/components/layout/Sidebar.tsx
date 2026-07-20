"use client"
import React, { useEffect, useMemo } from 'react'
import { Drawer, Empty, Skeleton } from 'antd'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetDrawerOpen } from '@/stores/reducers/layout/layoutSlice'
import SidebarHeader from './sidebar/SidebarHeader'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getSidebarAPI } from '@/services/routes/LayoutService'
import SidebarTabContent from './sidebar/SidebarTabContent'

interface Props {

}

const Sidebar: React.FC<Props> = (props) => {
  const { } = props
  const { drawer } = useAppSelector(state => state.layout)
  const { open } = drawer
  const dispatch = useAppDispatch()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sidebar_data'],
    queryFn: () => getSidebarAPI(),
    enabled: !!open,
    placeholderData: keepPreviousData
  })


  // Swipe-left anywhere on the drawer panel closes it. On phones the drawer
  // (378px) nearly fills the viewport, leaving a sliver of mask that's hard
  // to hit — swiping it shut is the natural gesture there. Document-level
  // native listeners cover the whole panel (header/body/footer) without
  // depending on antd's internal DOM; the 1.2× horizontal-dominance guard
  // keeps vertical menu scrolling from triggering a close.
  useEffect(() => {
    if (!open) return
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null
      start = target?.closest?.('.ant-drawer')
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!start) return
      const t = e.changedTouches[0]
      const dx = t.clientX - start.x
      const dy = Math.abs(t.clientY - start.y)
      start = null
      if (dx < -60 && Math.abs(dx) > dy * 1.2) dispatch(resetDrawerOpen())
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [open, dispatch])

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description='ไม่สามารถโหลดข้อมูลได้' />
    return <SidebarTabContent data={data?.data} />
  }, [data, isLoading, isError])

  return (
    <aside>
      <Drawer
        title={<SidebarHeader />}
        open={open}
        onClose={() => dispatch(resetDrawerOpen())}
        placement='left'
        closable={false}
        loading={isLoading}
      >
        {renderContent}
      </Drawer>
    </aside>
  )
}

export default React.memo<Props>(Sidebar)
