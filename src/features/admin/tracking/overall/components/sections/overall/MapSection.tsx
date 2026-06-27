import React, { useMemo, useState } from 'react'
import { TRACKING_STATIONS, TrackingStationType } from '../../../data/trackingStations'
import { Button, ConfigProvider } from 'antd'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import TrackingOverviewMarker from '@/components/map/markers/TrackingOverviewMarker'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTrackingPositionAPI } from '@/services/routes/TrackingService'
import { useOverallContext } from '../../../context'

interface Props {

}

type FilterOption = 'ทั้งหมด' | 'สถานี' | 'WIM' | 'เคลื่อนที่'
const FILTER_OPTIONS: FilterOption[] = ['ทั้งหมด', 'สถานี', 'WIM', 'เคลื่อนที่']

const FILTER_TO_TYPE: Record<Exclude<FilterOption, 'ทั้งหมด'>, TrackingStationType> = {
  สถานี: 'station',
  WIM: 'wim',
  เคลื่อนที่: 'mobile',
}


const MapSection: React.FC<Props> = (props) => {
  const { } = props
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ทั้งหมด')
  const { searchPosition } = useOverallContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking_position'],
    queryFn: () => getTrackingPositionAPI({}),
    placeholderData: keepPreviousData
  })

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

  // Map — row 1 on mobile (top), col 2 on desktop
  return (
    <div className='row-start-1 lg:col-start-2 lg:row-start-1 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
      <div className="filter-bar">
        <div className='bg-[#A2A2A233] rounded-3xl p-1.5'>
          <div className='flex items-center gap-3'></div>
          {renderOptionButton}
        </div>
      </div>
      <BaseMap
        initialCenter={[101.0, 14.5]}
        initialZoom={5.4}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        <ThailandMaskLayer />
        <TrackingOverviewMarker
          stations={TRACKING_STATIONS}
          visibleTypes={visibleTypes}
        />
      </BaseMap>
    </div>
  )
}

export default React.memo<Props>(MapSection)
