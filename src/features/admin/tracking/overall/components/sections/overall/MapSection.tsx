import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfigProvider, Image, Skeleton } from 'antd'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import { useOverallContext } from '../../../context'
import { usePosition } from '../../../hooks'
import { APIResponseTrackingPosition, PositionMobile, PositionStation, PositionWim } from '@/types/tracking/overall-api'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { theme } from '@/configs/antd/themeConfig'
import { fmtNumber } from '@/utils/formatNumber'

const STATION_ICON = '/atlas/images/icon-marker/Station.svg'
const WIM_ICON = '/atlas/images/icon-marker/Wim.svg'
const MOBILE_ICON = '/atlas/images/icon-marker/Moving.svg'
const OFFLINE_ICON = '/atlas/images/icon-marker/Offline.svg'

interface Props {

}

interface TrackingPosition {
  data?: APIResponseTrackingPosition
  isReady?: boolean
}

type FilterOption = 'ทั้งหมด' | 'สถานี' | 'WIM' | 'เคลื่อนที่'
const FILTER_OPTIONS: FilterOption[] = ['ทั้งหมด', 'สถานี', 'WIM', 'เคลื่อนที่']

const StationPopup: React.FC<{ data: PositionStation; router: ReturnType<typeof useRouter> }> = ({ data, router }) => {
  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black)`}>
      <section>
        <p className='fs-12 mb-1.5'>{data.LocationDescription || '-'}</p>
        <p className='fs-12 mb-1.5 text-white/50'>เปิดด่านล่าสุด : {'-'}</p>
        <p className={`fs-12 mb-1.5 ${data.isEnable ? 'text-[#05F2DB]' : 'text-red-500'}`}>สถานะ : {data.isEnable ? 'เปิดปกติ' : 'ปิด'} ●</p>
        <p className='fs-12 mb-1.5 text-(--yellow)'>รถเข้าชั่งทั้งหมด {fmtNumber(Number(data.Total)) || 0}</p>
        <p className='fs-12 mb-1.5 text-red-500'>รถเข้าน้ำหนักเกิน {fmtNumber(Number(data.Over)) || 0}</p>
      </section>
      <section className='mt-3'>
        <ConfigProvider theme={{ ...theme.theme }}>
          <Button
            htmlType='button'
            type='primary'
            size='small'
            shape='round'
            block
            onClick={() => router.push(`/admin/tracking/detail/station/${data.StationID}?station_type=STATION`)}
          >
            <p className='fs-12'>ดูรายละเอียด</p>
          </Button>
        </ConfigProvider>
      </section>
    </div>
  )
}

const WIMPopup: React.FC<{ data: PositionWim; router: ReturnType<typeof useRouter> }> = ({ data, router }) => {
  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black)`}>
      <section>
        <p className='fs-12 mb-1.5'>{data.LocationDescription || '-'}</p>
        <p className='fs-12 mb-1.5 text-white/50'>เปิดด่านล่าสุด : {'-'}</p>
        <p className={`fs-12 mb-1.5 ${data.isEnable ? 'text-[#05F2DB]' : 'text-red-500'}`}>สถานะ : {data.isEnable ? 'เปิดปกติ' : 'ปิด'} ●</p>
        <p className='fs-12 mb-1.5 text-(--yellow)'>รถเข้าชั่งทั้งหมด {fmtNumber(Number(data.Total)) || 0}</p>
        <p className='fs-12 mb-1.5 text-red-500'>รถเข้าน้ำหนักเกิน {fmtNumber(Number(data.Over)) || 0}</p>
      </section>
      <section className='mt-3'>
        <ConfigProvider theme={{ ...theme.theme }}>
          <Button
            htmlType='button'
            type='primary'
            size='small'
            shape='round'
            block
            onClick={() => router.push(`/admin/tracking/detail/wim/${data.StationID}?station_type=WIM`)}
          >
            <p className='fs-12'>ดูรายละเอียด</p>
          </Button>
        </ConfigProvider>
      </section>
    </div>
  )
}

const MobilePopup: React.FC<{ data: PositionMobile; router: ReturnType<typeof useRouter> }> = ({ data, router }) => {
  const renderName = useCallback((firstName: string, lastName: string) => {
    const fullName = [firstName, lastName]

    return fullName.join(' ').trim()
  }, [])

  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black)`}>
      <section>
        <p className='fs-12 mb-1.5'>{data.WayID || '-'}</p>
        <p className='fs-12 text-white/50 mb-1.5'>ผู้จัดตั้งด่าน: {renderName(data.first_name, data.last_name) || '-'}</p>
      </section>
      <section className='mt-3'>
        <ConfigProvider theme={{ ...theme.theme }}>
          <Button
            htmlType='button'
            type='primary'
            size='small'
            shape='round'
            block
            onClick={() => router.push(`/admin/tracking/detail/mobile/${data.TID}`)}
          >
            <p className='fs-12'>ดูรายละเอียด</p>
          </Button>
        </ConfigProvider>
      </section>
    </div>
  )
}

const TrackingMarkerLayer: React.FC<TrackingPosition> = (props) => {
  const { data, isReady } = props
  // Popups render into a detached React root created by mapbox's popup DOM
  // node (see showReactPopup in components/map/primitives/popupHelper.ts), so
  // they have no AppRouterContext of their own — useRouter() inside a popup
  // throws "invariant expected app router to be mounted". Resolve it here,
  // where the component is actually mounted in the app tree, and pass the
  // instance down as a plain prop instead.
  const router = useRouter()

  const renderStationMarker = useMemo(() => {
    return data?.station.map((item) => {
      return (
        <HTMLMarker
          key={item.StationID}
          lngLat={[Number(item.Longtitude), Number(item.Latitude)]}
          anchor="bottom"
          offset={[0, 19]}
          title={item.StationName}
          popup={() => <StationPopup data={item} router={router} />}
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
  }, [data?.station, router])

  const renderWIMMarker = useMemo(() => {
    return data?.wim.map((item) => {
      return (
        <HTMLMarker
          key={item.StationID}
          lngLat={[Number(item.Longtitude), Number(item.Latitude)]}
          anchor="bottom"
          offset={[0, 19]}
          title={item.StationName}
          popup={() => <WIMPopup data={item} router={router} />}
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
  }, [data?.wim, router])

  const renderMobileMarker = useMemo(() => {
    return data?.mobile.map((item) => {
      return (
        <HTMLMarker
          key={item.TID}
          lngLat={[Number(item.Longtitude), Number(item.Latitude)]}
          anchor="bottom"
          offset={[0, 19]}
          title={item.WayID}
          popup={() => <MobilePopup data={item} router={router} />}
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
  }, [data?.mobile, router])

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
