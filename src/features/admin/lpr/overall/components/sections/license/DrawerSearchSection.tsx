"use client"
import { Drawer, FloatButton } from 'antd'
import React, { useState } from 'react'
import { TbSearch } from 'react-icons/tb'
import SearchSection from './SearchSection'

const DrawerSearchSection: React.FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating search button (< xl) — same entry point as control-vms's
          DrawerSearchSection (yellow FloatButton, bottom-left), per design. */}
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
        size={600}
        styles={{
          wrapper: { width: '100%' },
          // overflow hidden: SearchSection scrolls its own list so the
          // search input stays pinned while the plates scroll.
          body: { padding: 0, background: 'var(--dark-black)', overflow: 'hidden' },
          header: {
            background: 'var(--dark-black)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          },
          close: { color: 'white' },
        }}
        title='ค้นหาป้ายทะเบียน'
      >
        <SearchSection
          openFromDrawer={true}
        />
      </Drawer>
    </>
  )
}

export default React.memo(DrawerSearchSection)
