"use client"
import { Button, Drawer, FloatButton } from 'antd'
import React, { useState } from 'react'
import { TbSearch } from 'react-icons/tb'
import SearchRouteSection from './SearchRouteSection'
import { useGPSContext } from '../../../context'

const DrawerSearchSection: React.FC = () => {
  const [open, setOpen] = useState(false)
  const { route } = useGPSContext()

  return (
    <>
      {/* When route is active: absolute button anchored to map top-left (below xl) */}
      {route.id ? (
        <Button
          type='primary'
          shape='circle'
          icon={<TbSearch className='fs-18' />}
          onClick={() => setOpen(true)}
          className='absolute! top-5 left-5 z-10 w-10! h-10! shadow-lg xl:hidden!'
        />
      ) : (
        /* Default: fixed FloatButton at bottom-left (below xl) */
        <FloatButton
          type='primary'
          icon={<TbSearch className='fs-18' />}
          onClick={() => setOpen(true)}
          className='xl:hidden!'
          style={{ bottom: 24, insetInlineEnd: 'auto', insetInlineStart: 24 }}
        />
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement='bottom'
        styles={{
          wrapper: { width: '100%' },
          body: { padding: 0, background: 'var(--dark-black)' },
          header: {
            background: 'var(--dark-black)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          },
          close: { color: 'white' },
        }}
        title='ค้นหาสายทาง'
      >
        <SearchRouteSection openFromDrawer={true} />
      </Drawer>
    </>
  )
}

export default React.memo(DrawerSearchSection)
