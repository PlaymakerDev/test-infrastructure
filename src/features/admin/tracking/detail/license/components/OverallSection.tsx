"use client"
import BaseMap from '@/components/map/BaseMap'
import { Button } from 'antd'
import React, { useState } from 'react'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbMapPin } from 'react-icons/tb'
import { DrawerSearchSection, SearchSection, StatSection, TimelineSection } from '../components'
import { useLicenseContext } from '../context'

function formatCoords(lat: number, lng: number): string {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
}

const MapSection: React.FC = () => {
  const { license } = useLicenseContext()
  const latest = license.timeline?.[0]

  const hasCoords = latest?.lat != null && latest?.lng != null
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${latest!.lat},${latest!.lng}`
    : 'https://www.google.com/maps'

  const coords = hasCoords ? formatCoords(latest!.lat!, latest!.lng!) : null

  return (
    <div className='relative h-80 xl:h-96 2xl:h-104 rounded-xl overflow-hidden'>
      <BaseMap
        initialCenter={hasCoords ? [latest!.lng!, latest!.lat!] : undefined}
        initialZoom={15}
        initialPitch={45}
      />

      {/* Centered pin */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none z-10'>
        <TbMapPin className='text-white text-4xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]' />
      </div>

      {/* Google Map button */}
      <Button
        type='primary'
        size='small'
        href={googleMapsUrl}
        target='_blank'
        className='absolute! top-3 right-3 z-10'
      >
        Google Map
      </Button>

      {/* Location overlay */}
      {latest && (
        <div className='absolute bottom-3 left-3 right-3 z-10 rounded-lg bg-black/70 backdrop-blur-sm px-4 py-3 flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <div className='shrink-0 w-6 h-6 rounded-full bg-(--yellow)/20 flex items-center justify-center'>
              <TbMapPin className='text-(--yellow) text-xs' />
            </div>
            <p className='fs-11 text-(--yellow) font-medium'>จุดที่ตรวจจับล่าสุด</p>
          </div>
          <p className='text-white leading-snug text-sm'>{latest.title}</p>
          {coords && <p className='fs-11 text-white/60'>{coords}</p>}
        </div>
      )}
    </div>
  )
}

const OverallSection: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(true)

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
          <TimelineSection />
        </div>

        {/* ══ RIGHT: map + location + stats
              xl+  → fixed side column, scrolls independently
              < xl → full width, stacks below center ══ */}
        <div className='w-full xl:w-80 2xl:w-96 xl:shrink-0 xl:overflow-y-auto flex flex-col gap-4 p-4 xl:border-l xl:border-white/5'>
          <MapSection />
          <StatSection />
        </div>

      </div>
    </>
  )
}

export default React.memo(OverallSection)
