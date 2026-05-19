"use client"
import { Button, Empty } from 'antd'
import React, { useMemo, useState } from 'react'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbMapPin } from 'react-icons/tb'
import { DetailSection, DrawerSearchSection, MapAndDetailSection, SearchSection } from '../components'
import { useVMSContext } from '../context'


const VMSSection: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(true)
  const { bureauSign } = useVMSContext()

  const renderDetailSection = useMemo(() => {
    if (!bureauSign?.id) return <Empty description='ไม่พบข้อมูลป้าย VMS' />
    return <DetailSection />
  }, [bureauSign?.id])

  const renderMapAndDetailSection = useMemo(() => {
    if (!bureauSign?.id) return <Empty description='ไม่พบข้อมูลป้าย VMS' />
    return <MapAndDetailSection />
  }, [bureauSign?.id])

  return (
    <>
      {/* Drawer button — visible below xl only */}
      <DrawerSearchSection />

      <div className='flex flex-col xl:flex-row xl:h-[calc(100vh-var(--nav-offset))] xl:overflow-hidden'>

        {/* ══ LEFT: collapsible panel — xl+ only ══ */}
        <div className='relative shrink-0 max-xl:hidden'>
          <div className={[
            'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
            searchOpen ? 'w-md rounded-lg' : 'w-0',
          ].join(' ')}>
            <div className='w-md h-full overflow-y-auto'>
              <SearchSection />
            </div>
          </div>

          <Button
            type='primary'
            shape='circle'
            title={searchOpen ? 'ซ่อนผลการค้นหา' : 'แสดงผลการค้นหา'}
            icon={searchOpen
              ? <TbLayoutSidebarLeftCollapse className='fs-18' />
              : <TbLayoutSidebarLeftExpand className='fs-18' />
            }
            onClick={() => setSearchOpen((prev) => !prev)}
            className='absolute! top-10 -right-5 z-20 w-10! h-10! shadow-lg'
          />
        </div>

        {/* ══ CENTER: timeline ══ */}
        <div className='flex-1 min-w-0 xl:overflow-y-auto px-4 xl:px-6 py-4'>
          {renderDetailSection}
        </div>

        {/* ══ RIGHT: map + location + stats
              xl+  → fixed side column, scrolls independently
              < xl → full width, stacks below center ══ */}
        <div className='w-full xl:w-80 2xl:w-96 xl:shrink-0 xl:overflow-y-auto flex flex-col gap-4 p-4 xl:border-l xl:border-white/5'>
          {renderMapAndDetailSection}
        </div>

      </div>
    </>
  )
}

export default React.memo(VMSSection)
