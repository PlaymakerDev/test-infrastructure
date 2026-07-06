"use client"
import { Button, Empty } from 'antd'
import React, { useState } from 'react'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { DetailSection, DrawerSearchSection, MapAndDetailSection, ModalConfirmCreate, ModalUpdateType, SearchSection } from '../components'
import { useControlVMSContext } from '../context'

const VMSSection: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(true)
  const { bureauSign } = useControlVMSContext()

  const hasSign = bureauSign !== null

  return (
    <>
      <DrawerSearchSection />

      <div className='flex flex-col xl:flex-row xl:h-[calc(100vh-var(--nav-offset))] xl:overflow-hidden'>

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

        <div className='flex-1 min-w-0 xl:overflow-y-auto px-4 xl:px-6 py-4'>
          {hasSign ? <DetailSection /> : <Empty description='ไม่พบข้อมูลป้าย VMS' />}
        </div>

        <div className='w-full xl:w-80 2xl:w-96 xl:shrink-0 xl:overflow-y-auto flex flex-col gap-4 p-4 xl:border-l xl:border-white/5'>
          {hasSign ? <MapAndDetailSection /> : <Empty description='ไม่พบข้อมูลป้าย VMS' />}
        </div>

      </div>
      <ModalConfirmCreate />
      <ModalUpdateType />
    </>
  )
}

export default React.memo(VMSSection)
