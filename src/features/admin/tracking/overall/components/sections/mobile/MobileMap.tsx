"use client"
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import { usePosition } from '@/features/admin/tracking/overall/hooks'
import { Button, ConfigProvider, Image, Skeleton } from 'antd'
import { APIResponseTrackingPosition, PositionMobile, PositionStation, PositionWim } from '@/types/tracking/overall-api'
import { theme } from '@/configs/antd/themeConfig'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { fmtNumber } from '@/utils/formatNumber'

// WIM tab: show only WIM-type stations (yellow pins) — same look & popup
// as the overview tab, just filtered.
// const VISIBLE_TYPES = new Set(['wim'] as const)
// PIN IMG
const STATION_ICON = '/atlas/images/icon-marker/Station.svg'
const WIM_ICON = '/atlas/images/icon-marker/Wim.svg'
const MOBILE_ICON = '/atlas/images/icon-marker/Moving.svg'
const OFFLINE_ICON = '/atlas/images/icon-marker/Offline.svg'

interface Props { }

interface TrackingPosition {
  data?: APIResponseTrackingPosition
  isReady?: boolean
}

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

const MobileMap: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isSuccess } = usePosition({
    StationType: '2',
  })

  const renderMarkerLayer = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    return <TrackingMarkerLayer data={data?.data} isReady={isSuccess} />
  }, [data?.data, isSuccess, isLoading])

  return (
    <div className="h-full">
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

export default React.memo<Props>(MobileMap)
