"use client"
import React, { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from 'antd'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { SearchCard } from '@/components/search-card'
import { DrawerMapSearchCard, StatisticsRouteSearchList } from '../../../overall/components/shared'
import { useAlertDetailContext } from '../context'
import { useLiveAlertRouteItems } from '../../../data/useLiveAlertRouteItems'
import { detailLabel } from '../../../data/routeItems'

const AlertDetailSidebar: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeParam = searchParams.get('route') || ''
  const detailParam = searchParams.get('detail') || ''
  const { searchText, setSearchText, searchOpen, setSearchOpen } = useAlertDetailContext()
  const { routeItems } = useLiveAlertRouteItems()

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
      onSelect={(route, detail) => router.push(`/admin/statistics/detail/alert?route=${encodeURIComponent(route)}&detail=${encodeURIComponent(detail)}`)}
    />
  )

  return (
    <>
      <DrawerMapSearchCard>
        <SearchCard placeholder="ค้นหาสายทาง..." onChange={setSearchText}>{routeList}</SearchCard>
      </DrawerMapSearchCard>

      <div className='relative shrink-0 max-xl:hidden self-stretch'>
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
    </>
  )
}

export default React.memo(AlertDetailSidebar)
