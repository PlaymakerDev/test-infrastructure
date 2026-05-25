"use client"
import React, { useMemo, useState } from 'react'
import { Button, ConfigProvider } from 'antd'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import TrackingOverviewMarker from '@/components/map/markers/TrackingOverviewMarker'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import {
  TRACKING_STATIONS,
  type TrackingStationType,
} from '@/features/admin/tracking/overall/data/trackingStations'

type FilterOption = 'ทั้งหมด' | 'สถานี' | 'WIM' | 'เคลื่อนที่'
const FILTER_OPTIONS: FilterOption[] = ['ทั้งหมด', 'สถานี', 'WIM', 'เคลื่อนที่']

const FILTER_TO_TYPE: Record<Exclude<FilterOption, 'ทั้งหมด'>, TrackingStationType> = {
  สถานี: 'station',
  WIM: 'wim',
  เคลื่อนที่: 'mobile',
}

const mockCameras = [
  {
    id: 1,
    code: 'DRR-CCO-Weight-CAM01 (N) ขาออก ด่านชั่ง',
    location: 'สถานีด่านฯ ฉะเชิงเทรา',
  },
  {
    id: 2,
    code: '6B4M-WIM-NON1002-CAM001',
    location: 'WIM นนทบุรี (นน.1002) ฝั่งบาง',
  },
  {
    id: 3,
    code: '67PSK-WIM-NON4018-F002',
    location: 'WIM เลี้ยงเมืองนนทบุรี (นน.4018)',
  },
]

const LocationSection = () => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ทั้งหมด')

  const visibleTypes = useMemo(() => {
    if (activeFilter === 'ทั้งหมด') {
      return new Set<TrackingStationType>(['wim', 'mobile', 'station'])
    }
    return new Set<TrackingStationType>([FILTER_TO_TYPE[activeFilter]])
  }, [activeFilter])

  const renderOptionButton = useMemo(() => {
    return FILTER_OPTIONS.map((item) => (
      <ConfigProvider
        key={item}
        theme={{ token: { colorPrimary: '#212121' } }}
      >
        <Button
          shape='round'
          type={activeFilter === item ? 'primary' : 'text'}
          size='middle'
          onClick={() => setActiveFilter(item)}
        >
          <p className={`fs-12 ${activeFilter === item ? 'text-(--yellow)' : 'text-white'}`}>{item}</p>
        </Button>
      </ConfigProvider>
    ))
  }, [activeFilter])

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:h-[75dvh]'>

      {/* Camera list — hidden on mobile, col 1 on desktop */}
      <div className='flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:overflow-y-auto lg:h-full lg:pr-1'>
        {mockCameras.map((item) => (
          <div key={item.id} className='flex-1 min-h-0 flex flex-col'>
            <figure className='flex-1 min-h-0 rounded-lg overflow-hidden mb-1.5'>
              <HLSLivePlayer figureClassName='h-full' />
            </figure>
            <h4 className="camera-code">{item.code}</h4>
            <p className="camera-location">{item.location}</p>
          </div>
        ))}
      </div>

      {/* Map — row 1 on mobile (top), col 2 on desktop */}
      <div className='row-start-1 lg:col-start-2 lg:row-start-1 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <div className="filter-bar">
          <div className='bg-[#A2A2A233] rounded-3xl p-1.5'>
            <div className='flex items-center gap-3'></div>
            {renderOptionButton}
          </div>
        </div>
        <BaseMap initialCenter={[101.0, 14.5]} initialZoom={5.4}>
          <ThailandMaskLayer />
          <TrackingOverviewMarker
            stations={TRACKING_STATIONS}
            visibleTypes={visibleTypes}
          />
        </BaseMap>
      </div>

    </div>
  )
}

export default React.memo(LocationSection)
