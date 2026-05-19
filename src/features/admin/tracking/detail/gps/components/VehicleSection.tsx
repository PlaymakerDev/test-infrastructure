"use client"
import React, { useState } from 'react'
import { Button } from 'antd'
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

const VehicleSection: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(true)
  const { route, licenseOpen, setLicenseOpen } = useGPSContext()

  return (
    <div className='h-full overflow-hidden flex'>

      {/* ══ LEFT: collapsible panel — xl+ only ══ */}
      <div className='relative shrink-0 max-xl:hidden'>
        <div className={[
          'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
          searchOpen ? 'w-md rounded-lg' : 'w-0',
        ].join(' ')}>
          <div className='w-md h-full overflow-y-auto'>
            <SearchRouteSection />
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
        <DrawerSearchSection />
        <DrawerSearchLicense />
        <MapSection />
        {route.id && <RouteDetail />}
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
            <SearchLicenseSection />
          </div>
        </div>
      </div>

    </div>
  )
}

export default React.memo(VehicleSection)
