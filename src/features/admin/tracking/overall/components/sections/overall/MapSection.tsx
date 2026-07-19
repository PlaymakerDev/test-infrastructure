import React, { useCallback, useMemo, useState } from 'react'
import { Button, ConfigProvider, Image, Skeleton } from 'antd'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import { useOverallContext } from '../../../context'
import { usePosition } from '../../../hooks'
import { APIResponseTrackingPosition, PositionMobile, PositionStation, PositionWim } from '@/types/tracking/overall-api'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { theme } from '@/configs/antd/themeConfig'

const STATION_ICON = '/images/icon-marker/Station.svg'
const WIM_ICON = '/images/icon-marker/Wim.svg'
const MOBILE_ICON = '/images/icon-marker/Moving.svg'
const OFFLINE_ICON = '/images/icon-marker/Offline.svg'

interface Props {

}

interface TrackingPosition {
  data?: APIResponseTrackingPosition
  isReady?: boolean
}

type FilterOption = 'ทั้งหมด' | 'สถานี' | 'WIM' | 'เคลื่อนที่'
const FILTER_OPTIONS: FilterOption[] = ['ทั้งหมด', 'สถานี', 'WIM', 'เคลื่อนที่']

const StationPopup: React.FC<{ data: PositionStation }> = ({ data }) => {
  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black)  ${data.isEnable ? `border-green-400` : 'border-red-400'}`}>
      <section>
        <p className='fs-12'>ชื่อสถานี: <strong>{data.StationName || '-'}</strong></p>
        <p className='fs-12'>ชื่อ WIM: <strong>{data.LocationDescription || '-'}</strong></p>
      </section>
      <hr className='my-3' />
      <section className='mt-1.5'>
        <p className='fs-12'>จำนวนรถเข้าชั่ง: <strong>{data.Total || 0}</strong></p>
        <p className='fs-12'>จำนวนบรรจุเกิน: <strong>{data.Over || 0}</strong></p>
      </section>
      <hr className='my-3' />
      <section className='mt-1.5'>
        <p className='fs-12'>สถานะ: <strong>{data.isEnable ? 'ออนไลน์' : 'ออฟไลน์'}</strong></p>
      </section>
      <section className='mt-3'>
        <ConfigProvider theme={{ ...theme.theme }}>
          <Button
            htmlType='button'
            type='primary'
            size='small'
            shape='round'
            block
          >
            <p className='fs-12'>ดูเพิ่มเติม</p>
          </Button>
        </ConfigProvider>
      </section>
    </div>
  )
}

const WIMPopup: React.FC<{ data: PositionWim }> = ({ data }) => {
  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black) ${data.isEnable ? `border-(--yellow)` : 'border-red-400'}`}>
      <section>
        <p className='fs-12'>ชื่อสถานี: <strong>{data.StationName || '-'}</strong></p>
        <p className='fs-12'>ชื่อ WIM: <strong>{data.LocationDescription || '-'}</strong></p>
      </section>
      <hr className='my-3' />
      <section className='mt-1.5'>
        <p className='fs-12'>จำนวนรถเข้าชั่ง: <strong>{data.Total || 0}</strong></p>
        <p className='fs-12'>จำนวนบรรจุเกิน: <strong>{data.Over || 0}</strong></p>
      </section>
      <hr className='my-3' />
      <section className='mt-1.5'>
        <p className='fs-12'>สถานะ: <strong>{data.isEnable ? 'ออนไลน์' : 'ออฟไลน์'}</strong></p>
      </section>
      <section className='mt-3'>
        <ConfigProvider theme={{ ...theme.theme }}>
          <Button
            htmlType='button'
            type='primary'
            size='small'
            shape='round'
            block
          >
            <p className='fs-12'>ดูเพิ่มเติม</p>
          </Button>
        </ConfigProvider>
      </section>
    </div>
  )
}

const MobilePopup: React.FC<{ data: PositionMobile }> = ({ data }) => {

  const renderName = useCallback((firstName: string, lastName: string) => {
    const fullName = [firstName, lastName]

    return fullName.join(' ').trim()
  }, [])

  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black) border-pink-400`}>
      <section>
        <p className='fs-12'>ชื่อสถานี: <strong>{data.WayID || '-'}</strong></p>
        <p className='fs-12'>ผู้จัดตั้งด่าน: <strong>{renderName(data.first_name, data.last_name) || '-'}</strong></p>
      </section>
      <section className='mt-3'>
        <ConfigProvider theme={{ ...theme.theme }}>
          <Button
            htmlType='button'
            type='primary'
            size='small'
            shape='round'
            block
          >
            <p className='fs-12'>ดูเพิ่มเติม</p>
          </Button>
        </ConfigProvider>
      </section>
    </div>
  )
}

const TrackingMarkerLayer: React.FC<TrackingPosition> = (props) => {
  const { data, isReady } = props


  const renderStationMarker = useMemo(() => {
    return data?.station.map((item) => {
      return (
        <HTMLMarker
          key={item.StationID}
          lngLat={[Number(item.Longtitude), Number(item.Latitude)]}
          anchor="bottom"
          offset={[0, 19]}
          title={item.StationName}
          popup={() => <StationPopup data={item} />}
          popupOptions={{ offset: 10, closeButton: false }}
        >
          <Image
            src={item.isEnable ? STATION_ICON : OFFLINE_ICON}
            alt="station-pin"
            width={item.isEnable ? 52 : 43}
            height={item.isEnable ? 55 : 46}
            preview={false}
          />
        </HTMLMarker>
      )
    })
  }, [data?.station])

  const renderWIMMarker = useMemo(() => {
    return data?.wim.map((item) => {
      return (
        <HTMLMarker
          key={item.StationID}
          lngLat={[Number(item.Longtitude), Number(item.Latitude)]}
          anchor="bottom"
          offset={[0, 19]}
          title={item.StationName}
          popup={() => <WIMPopup data={item} />}
          popupOptions={{ offset: 10, closeButton: false }}
        >
          <Image
            src={item.isEnable ? WIM_ICON : OFFLINE_ICON}
            alt="wim-pin"
            width={item.isEnable ? 52 : 43}
            height={item.isEnable ? 55 : 46}
            preview={false}
          />
        </HTMLMarker>
      )
    })
  }, [data?.wim])

  const renderMobileMarker = useMemo(() => {
    return data?.mobile.map((item) => {
      return (
        <HTMLMarker
          key={item.TID}
          lngLat={[Number(item.Longtitude), Number(item.Latitude)]}
          anchor="bottom"
          offset={[0, 19]}
          title={item.WayID}
          popup={() => <MobilePopup data={item} />}
          popupOptions={{ offset: 10, closeButton: false }}
        >
          <Image
            src={MOBILE_ICON}
            alt="mobile-pin"
            width={43}
            height={46}
            preview={false}
          />
        </HTMLMarker>
      )
    })
  }, [data?.mobile])

  if (!isReady) return

  return (
    <>
      {renderStationMarker}
      {renderWIMMarker}
      {renderMobileMarker}
    </>
  )
}

const MapSection: React.FC<Props> = (props) => {
  const { } = props
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ทั้งหมด')
  const { searchPosition, setSearchPosition } = useOverallContext()

  const { data, isLoading, isSuccess } = usePosition({
    StationType: searchPosition?.StationType,
  })

  const onSearch = useCallback((item: FilterOption) => {
    setActiveFilter(item)
    //'ทั้งหมด' | 'สถานี' | 'WIM' | 'เคลื่อนที่'
    switch (item) {
      case 'ทั้งหมด':
        return setSearchPosition({})
      case 'สถานี':
        return setSearchPosition({ StationType: '1' })
      case 'WIM':
        return setSearchPosition({ StationType: '3' })
      case 'เคลื่อนที่':
        return setSearchPosition({ StationType: '2' })
    }
  }, [setSearchPosition])

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
          onClick={() => onSearch(item)}
        >
          <p className={`fs-12 ${activeFilter === item ? 'text-(--yellow)' : 'text-white'}`}>{item}</p>
        </Button>
      </ConfigProvider>
    ))
  }, [activeFilter, onSearch])

  const renderMarkerLayer = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    return <TrackingMarkerLayer data={data?.data} isReady={isSuccess} />
  }, [data?.data, isSuccess, isLoading])

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
        {renderMarkerLayer}
      </BaseMap>
    </div>
  )
}

export default React.memo<Props>(MapSection)
