"use client"
import React, { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchCard } from '@/components/search-card'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setMapPanelsOpen } from '@/stores/reducers/layout/layoutSlice'
import { DrawerMapSearchCard, StatisticsRouteSearchList } from '../../../overall/components/shared'
import { useIncidentDetailContext } from '../context'
import { useLiveIncidentRouteItems } from '../../../data/useLiveIncidentRouteItems'
import { detailLabel } from '../../../data/routeItems'

const IncidentDetailSidebar: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeParam = searchParams.get('route') || ''
  const detailParam = searchParams.get('detail') || ''
  const { searchText, setSearchText } = useIncidentDetailContext()
  const dispatch = useAppDispatch()
  const searchOpen = useAppSelector((state) => state.layout.map_panels.open)

  useEffect(() => {
    dispatch(setMapPanelsOpen({ open: true }))
  }, [dispatch])

  const { routeItems } = useLiveIncidentRouteItems()
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
      onSelect={(route, detail) => router.push(`/admin/statistics/detail/incident?route=${encodeURIComponent(route)}&detail=${encodeURIComponent(detail)}`)}
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
      </div>
    </>
  )
}

export default React.memo(IncidentDetailSidebar)
