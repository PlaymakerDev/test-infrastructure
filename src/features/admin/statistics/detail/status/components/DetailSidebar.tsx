"use client"
import React, { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from 'antd'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { SearchCard } from '@/components/search-card'
import { StatisticsRouteSearchList } from '../../../overall/components/shared'
import { useStatusDetailContext } from '../context'
import { useLiveStatusRouteItems } from '../../../data/useLiveStatusRouteItems'
import { detailLabel } from '../../../data/routeItems'

interface DetailSidebarProps {
  fromDrawer?: boolean
}

const DetailSidebar: React.FC<DetailSidebarProps> = ({ fromDrawer = false }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeParam = searchParams.get('route') || ''
  const detailParam = searchParams.get('detail') || ''
  const { searchText, setSearchText, searchOpen, setSearchOpen } = useStatusDetailContext()
  const { routeItems } = useLiveStatusRouteItems()

  const filteredRoutes = useMemo(() => {
    if (!searchText) return routeItems
    const keyword = searchText.toLowerCase()
    return routeItems
      .map((item) => ({
        ...item,
        sub3: item.sub3.filter((sub) =>
          sub.label.toLowerCase().includes(keyword) || sub.detail.some((detail) => detailLabel(detail).toLowerCase().includes(keyword))),
      }))
      .filter((item) => item.name.toLowerCase().includes(keyword) || item.sub3.length > 0)
  }, [searchText, routeItems])

  const routeList = (
    <StatisticsRouteSearchList
      routeItems={filteredRoutes}
      selectedRoute={routeParam}
      selectedDetail={detailParam}
      onSelect={(route, detail) => router.push(`/admin/statistics/detail/status?route=${encodeURIComponent(route)}&detail=${encodeURIComponent(detail)}`)}
    />
  )

  if (fromDrawer) {
    return (
      <div className='bg-(--dark-black) h-full'>
        <div className='w-full h-full overflow-y-auto'>
          <SearchCard placeholder="ค้นหาสายทาง..." onChange={setSearchText}>{routeList}</SearchCard>
        </div>
      </div>
    )
  }

  return (
    <div className='shrink-0 max-xl:hidden' style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 370 }}>
      <div className={[
        'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
        searchOpen ? 'w-[370px] rounded-lg' : 'w-0',
      ].join(' ')}>
        <div className='w-[370px] h-full overflow-y-auto'>
          <SearchCard placeholder="ค้นหาสายทาง..." onChange={setSearchText} className='h-full'>
            {routeList}
          </SearchCard>
        </div>
      </div>
      <Button
        type='primary'
        shape='circle'
        title={searchOpen ? 'ซ่อนรายการสายทาง' : 'แสดงรายการสายทาง'}
        icon={searchOpen ? <TbLayoutSidebarLeftCollapse className='fs-18' /> : <TbLayoutSidebarLeftExpand className='fs-18' />}
        onClick={() => setSearchOpen(!searchOpen)}
        className='absolute! top-10 -right-5 z-20 w-10! h-10! shadow-lg'
      />
    </div>
  )
}

export default React.memo(DetailSidebar)
