"use client"
import React, { useState } from 'react'
import { Button, Drawer, FloatButton } from 'antd'
import { TbSearch } from 'react-icons/tb'
import DetailSidebar from './DetailSidebar'

const DrawerDetailSidebar: React.FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <FloatButton
        type='primary'
        icon={<TbSearch className='fs-18' />}
        onClick={() => setOpen(true)}
        className='xl:hidden!'
        style={{ bottom: 24, insetInlineEnd: 'auto', insetInlineStart: 24 }}
      />

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
        <div style={{ height: '60vh', overflow: 'auto' }}>
          <DetailSidebar fromDrawer />
        </div>
      </Drawer>
    </>
  )
}

export default React.memo(DrawerDetailSidebar)
