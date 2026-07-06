"use client"
import React, { useCallback, useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTrackingPositionAPI } from '@/services/routes/TrackingService'
import { Button, ConfigProvider, Image, Skeleton } from 'antd'
import { APIResponseTrackingPosition, PositionMobile, PositionStation, PositionWim } from '@/types/tracking/overall-api'
import { theme } from '@/configs/antd/themeConfig'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'

// WIM tab: show only WIM-type stations (yellow pins) — same look & popup
// as the overview tab, just filtered.
// const VISIBLE_TYPES = new Set(['wim'] as const)
// PIN IMG
const STATION_ICON = '/images/icon-marker/Station.svg'
const WIM_ICON = '/images/icon-marker/Wim.svg'
const MOBILE_ICON = '/images/icon-marker/Moving.svg'
const OFFLINE_ICON = '/images/icon-marker/Offline.svg'

interface Props { }

interface TrackingPosition {
  data?: APIResponseTrackingPosition
  isReady?: boolean
}

const StationPopup: React.FC<{ data: PositionStation }> = ({ data }) => {
  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black)  ${data.isEnable ? `border-green-400` : 'border-red-400'}`}>
      <section>
        <p className='fs-11'>ชื่อสถานี: <strong>{data.StationName || '-'}</strong></p>
        <p className='fs-11'>ชื่อ WIM: <strong>{data.LocationDescription || '-'}</strong></p>
      </section>
      <hr className='my-3' />
      <section className='mt-1.5'>
        <p className='fs-11'>จำนวนรถเข้าชั่ง: <strong>{data.Total || 0}</strong></p>
        <p className='fs-11'>จำนวนบรรจุเกิน: <strong>{data.Over || 0}</strong></p>
      </section>
      <hr className='my-3' />
      <section className='mt-1.5'>
        <p className='fs-11'>สถานะ: <strong>{data.isEnable ? 'ออนไลน์' : 'ออฟไลน์'}</strong></p>
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
            <p className='fs-11'>ดูเพิ่มเติม</p>
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
        <p className='fs-11'>ชื่อสถานี: <strong>{data.StationName || '-'}</strong></p>
        <p className='fs-11'>ชื่อ WIM: <strong>{data.LocationDescription || '-'}</strong></p>
      </section>
      <hr className='my-3' />
      <section className='mt-1.5'>
        <p className='fs-11'>จำนวนรถเข้าชั่ง: <strong>{data.Total || 0}</strong></p>
        <p className='fs-11'>จำนวนบรรจุเกิน: <strong>{data.Over || 0}</strong></p>
      </section>
      <hr className='my-3' />
      <section className='mt-1.5'>
        <p className='fs-11'>สถานะ: <strong>{data.isEnable ? 'ออนไลน์' : 'ออฟไลน์'}</strong></p>
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
            <p className='fs-11'>ดูเพิ่มเติม</p>
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
        <p className='fs-11'>ชื่อสถานี: <strong>{data.WayID || '-'}</strong></p>
        <p className='fs-11'>ผู้จัดตั้งด่าน: <strong>{renderName(data.first_name, data.last_name) || '-'}</strong></p>
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
            <p className='fs-11'>ดูเพิ่มเติม</p>
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

const MobileMap: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ['mobile_position',],
    queryFn: () => getTrackingPositionAPI({
      StationType: '2',
    }),
    placeholderData: keepPreviousData
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
