"use client"
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import { Button, Empty } from 'antd'
import React, { useMemo, useState } from 'react'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbMapPin } from 'react-icons/tb'
import { DrawerSearchSection, SearchSection, StatSection, TimelineSection } from '../components'
import { useOverallContext } from '../context'
import { usePlateDetail } from '@/hooks/queries/lpr'

const formatCoords = (lat: number, lng: number): string => {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
}

const MapSection: React.FC = () => {
  const { selected } = useOverallContext()
  const { data: detail } = usePlateDetail(selected?.plate_province, selected?.plate_number)

  // Every location the vehicle passed (all-time unique points), sorted latest
  // first by the backend. detection_location = [lat, lng] → convert to [lng, lat]
  // for Mapbox; drop pins with missing coords.
  const pins = useMemo(() => {
    return (detail?.map_pins ?? [])
      .map((pin) => {
        const loc = pin.detection_location
        if (!Array.isArray(loc) || loc[0] == null || loc[1] == null) return null
        return {
          lngLat: [loc[1], loc[0]] as [number, number],
          detection_point: pin.detection_point ?? 'ไม่ระบุจุดตรวจจับ',
          count: pin.count,
          latest: pin.latest_captured_at_display,
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
  }, [detail])

  const coords = useMemo(() => pins.map((p) => p.lngLat), [pins])

  // Which pin the overlay describes — tracked by a stable coord key so it
  // naturally falls back to the latest (pins[0]) when the plate changes (the
  // old key no longer matches any pin). No reset effect needed.
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const keyOf = (p: { lngLat: [number, number] }) => `${p.lngLat[0]},${p.lngLat[1]}`
  const activeIndex = Math.max(0, pins.findIndex((p) => keyOf(p) === activeKey))
  const active = pins[activeIndex] ?? pins[0]

  const googleMapsUrl = active
    ? `https://www.google.com/maps?q=${active.lngLat[1]},${active.lngLat[0]}`
    : 'https://www.google.com/maps'
  const activeCoordsText = active ? formatCoords(active.lngLat[1], active.lngLat[0]) : null

  return (
    <div className='relative h-80 xl:h-96 2xl:h-104 rounded-xl overflow-hidden'>
      <BaseMap initialCenter={coords[0]} initialZoom={13} initialPitch={45}>
        {pins.map((pin, i) => (
          <HTMLMarker
            key={`${pin.lngLat[0]},${pin.lngLat[1]}-${i}`}
            lngLat={pin.lngLat}
            anchor='bottom'
            title={`${pin.detection_point} · ${pin.count} ครั้ง · ล่าสุด ${pin.latest}`}
            onClick={() => setActiveKey(keyOf(pin))}
          >
            <TbMapPin
              className={
                i === activeIndex
                  ? 'text-(--yellow) text-4xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]'
                  : 'text-white text-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]'
              }
            />
          </HTMLMarker>
        ))}
        {coords.length > 0 && (
          <FitBoundsEffect
            coords={coords}
            maxZoom={15}
            pitch={45}
            padding={{ top: 50, bottom: 110, left: 40, right: 40 }}
          />
        )}
      </BaseMap>

      {/* Google Map button — links to the active pin */}
      <Button
        type='primary'
        size='small'
        href={googleMapsUrl}
        target='_blank'
        className='absolute! top-3 right-3 z-10'
      >
        Google Map
      </Button>

      {/* Active-location overlay — updates on marker click */}
      {active && (
        <div className='absolute bottom-3 left-3 right-3 z-10 rounded-lg bg-black/70 backdrop-blur-sm px-4 py-3 flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <div className='shrink-0 w-6 h-6 rounded-full bg-(--yellow)/20 flex items-center justify-center'>
              <TbMapPin className='text-(--yellow) text-xs' />
            </div>
            <p className='fs-12 text-(--yellow) font-medium'>
              {activeIndex === 0 ? 'จุดที่ตรวจจับล่าสุด' : 'จุดที่ตรวจจับ'}
            </p>
          </div>
          <p className='text-white leading-snug text-sm'>{active.detection_point}</p>
          {activeCoordsText && <p className='fs-12 text-white/60'>{activeCoordsText}</p>}
        </div>
      )}
    </div>
  )
}

const LicenseSection: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(true)
  const { selected } = useOverallContext()

  const renderTimelineSection = useMemo(() => {
    if (!selected) return <Empty description='ไม่พบข้อมูลป้ายทะเบียน' />
    return <TimelineSection />
  }, [selected])

  const renderMapAndStatSection = useMemo(() => {
    if (!selected) return <Empty description='ไม่พบข้อมูลป้ายทะเบียน' />
    return (
      <>
        <MapSection />
        <StatSection />
      </>
    )
  }, [selected])

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
          {renderTimelineSection}
        </div>

        {/* ══ RIGHT: map + location + stats
              xl+  → fixed side column, scrolls independently
              < xl → full width, stacks below center ══ */}
        <div className='w-full xl:w-80 2xl:w-96 xl:shrink-0 xl:overflow-y-auto flex flex-col gap-4 p-4 xl:border-l xl:border-white/5'>
          {renderMapAndStatSection}
        </div>

      </div>
    </>
  )
}

export default React.memo(LicenseSection)
