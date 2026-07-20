"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Empty, Skeleton } from 'antd'
import {
  TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand,
  TbLayoutSidebarRightCollapse,
} from 'react-icons/tb'
import {
  DrawerSearchSection,
  DrawerSearchLicense,
  SearchRouteSection,
  MapSection,
  RouteDetail,
  SearchLicenseSection,
} from '../components'
import { useGPSContext } from '../context'
import { useQuery } from '@tanstack/react-query'
import { getTrackingGPSAllVehicleLocationAPI, getTrackingGPSGeoRoadAPI, getTrackingGPSVehicleLocationAPI } from '@/services/routes/TrackingGPSService'

const VehicleSection: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(true)
  const [routeSearch, setRouteSearch] = useState('')
  const { selectRoute, setSelectRoute, licenseOpen, setLicenseOpen } = useGPSContext()

  const {
    data: allVehicleLocationData,
    isLoading: allVehicleLocationIsLoading,
    isError: allVehicleLocationIsError
  } = useQuery({
    queryKey: ['all_vehicle_location', routeSearch],
    queryFn: () => getTrackingGPSAllVehicleLocationAPI({
      search: routeSearch
    })
  })

  // เข้าแท็บ VEHICLE ครั้งแรก (ยังไม่มีการเลือกสายทางเอง) ให้เลือกสายทางแรกในลิสต์เป็นค่าเริ่มต้น
  useEffect(() => {
    if (selectRoute?.road_id) return
    const firstRoute = allVehicleLocationData?.data.data.list?.[0]
    if (firstRoute) setSelectRoute(firstRoute)
  }, [allVehicleLocationData?.data.data.list, selectRoute?.road_id, setSelectRoute])

  const {
    data: vehicleLocationData,
    isLoading: vehicleLocationIsLoading,
    isError: vehicleLocationIsError
  } = useQuery({
    queryKey: ['vehicle_location', selectRoute?.road_id],
    queryFn: () => getTrackingGPSVehicleLocationAPI({
      road_id: selectRoute?.road_id
    }),
    enabled: !!selectRoute?.road_id
  })

  const {
    data: geoRoadData,
    isLoading: geoRoadIsLoading,
    isError: geoRoadIsError
  } = useQuery({
    queryKey: ['geo_road', selectRoute?.road_id],
    queryFn: () => getTrackingGPSGeoRoadAPI({
      road_id: selectRoute?.road_id
    }),
    enabled: !!selectRoute?.road_id
  })

  const isLoading = vehicleLocationIsLoading || (!!selectRoute?.road_id && geoRoadIsLoading)
  const isError = vehicleLocationIsError || geoRoadIsError
  const isEmpty = !vehicleLocationIsLoading && !vehicleLocationIsError && !selectRoute?.road_id

  const renderRouteDetail = useMemo(() => {
    if (!selectRoute?.road_id) return null

    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 5 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    if (isEmpty) return <Empty description="ไม่พบข้อมูล" />

    return (
      <RouteDetail
        road={geoRoadData?.data.data}
        vehicle={vehicleLocationData?.data.data}
      />
    )
  }, [isLoading, isError, isEmpty, geoRoadData?.data.data, vehicleLocationData?.data.data, selectRoute?.road_id])

  const onSearchRoute = useCallback((search: string) => {
    setRouteSearch(search)
  }, [])

  return (
    <div className='h-full overflow-hidden flex'>

      {/* ══ LEFT: collapsible panel — xl+ only ══ */}
      <div className='relative shrink-0 max-xl:hidden'>
        <div className={[
          'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
          searchOpen ? 'w-md rounded-lg' : 'w-0',
        ].join(' ')}>
          <div className='w-md h-full overflow-y-auto'>
            <SearchRouteSection
              data={allVehicleLocationData?.data.data}
              isLoading={allVehicleLocationIsLoading}
              isError={allVehicleLocationIsError}
              onSearch={onSearchRoute}
            />
          </div>
        </div>

        <Button
          type='primary'
          shape='circle'
          title={searchOpen ? 'ซ่อนรายการสายทาง' : 'แสดงรายการสายทาง'}
          icon={searchOpen
            ? <TbLayoutSidebarLeftCollapse className='fs-18' />
            : <TbLayoutSidebarLeftExpand className='fs-18' />
          }
          onClick={() => setSearchOpen((prev) => !prev)}
          className='absolute! top-10 -right-5 z-20 w-10! h-10! shadow-lg'
        />
      </div>

      {/* ══ MAIN: map ══ */}
      <div className='flex-1 min-w-0 relative'>
        <DrawerSearchSection
          data={allVehicleLocationData?.data.data}
          isLoading={allVehicleLocationIsLoading}
          isError={allVehicleLocationIsError}
          onSearch={onSearchRoute}
        />
        <DrawerSearchLicense
          data={vehicleLocationData?.data.data}
        />
        <MapSection
          road={geoRoadData?.data.data}
          vehicle={vehicleLocationData?.data.data}
        />
        {renderRouteDetail}
      </div>

      {/* ══ RIGHT: collapsible panel — xl+ only ══ */}
      <div className='relative shrink-0 max-xl:hidden'>
        {licenseOpen && (
          <Button
            type='primary'
            shape='circle'
            title='ซ่อนรายการทะเบียน'
            icon={<TbLayoutSidebarRightCollapse className='fs-18' />}
            onClick={() => setLicenseOpen(false)}
            className='absolute! top-10 -left-5 z-20 w-10! h-10! shadow-lg'
          />
        )}

        <div className={[
          'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
          licenseOpen ? 'w-md rounded-lg' : 'w-0',
        ].join(' ')}>
          <div className='w-md h-full overflow-y-auto'>
            <SearchLicenseSection
              data={vehicleLocationData?.data.data}
            />
          </div>
        </div>
      </div>

    </div>
  )
}

export default React.memo(VehicleSection)
