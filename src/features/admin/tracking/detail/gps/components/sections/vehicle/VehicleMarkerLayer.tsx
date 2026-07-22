"use client"
import React from 'react'
import { Image } from 'antd'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { CarList } from '@/types/tracking/detail-gps-api'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  cars?: CarList[]
}

// Raw <img src> is NOT auto-prefixed by Next — carry the deploy basePath
// ('/atlas' in prod, '' in dev) explicitly, same convention as
// TrackingOverviewMarker.tsx.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const ICON_GREEN = `${BASE_PATH}/images/vehicles/status/green_vehicle.png`
const ICON_ORANGE = `${BASE_PATH}/images/vehicles/status/orange_vehicle.png`
const ICON_RED = `${BASE_PATH}/images/vehicles/status/red_vehicle.png`
// DEFAULT 52
const ICON_WIDTH = 78
// DEFAULT 32
const ICON_HEIGHT = 48

/** `car_location` comes back as WKT, e.g. `"POINT(100.974914 13.059577)"` —
 *  WKT order is X Y i.e. lng lat, already Mapbox's own [lng, lat] order. */
const parseCarLocation = (value?: string): [number, number] | null => {
  if (!value) return null
  const match = /POINT\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(value)
  if (!match) return null
  const lng = Number(match[1])
  const lat = Number(match[2])
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

/** speed === 0 wins regardless of overweight status; otherwise red/green by isoverweight. */
const getIcon = (car: CarList): string => {
  if (car.speed === 0) return ICON_ORANGE
  return car.isoverweight === 'Y' ? ICON_RED : ICON_GREEN
}

const CarPopup: React.FC<{ car: CarList }> = ({ car }) => {
  return (
    <div className='min-w-56 rounded-lg px-4 py-3 bg-(--dark-black)'>
      <section>
        <h3 className='font-normal!'>{car.plate_no || 'ไม่ระบุทะเบียน'}</h3>
        <p className='fs-12 text-white/50'>{car.plate_province || '-'}</p>
      </section>
      <section className='mt-3'>
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between gap-4'>
            <p className='fs-12'>ความเร็ว</p>
            <p className={`fs-12 ${car.isoverweight === 'N' ? 'text-[#05F2DB]' : 'text-red-500'}`}>{fmtNumber(Number(car.speed)) || 0} กม./ชม.</p>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <p className='fs-12'>เกณฑ์น้ำหนัก</p>
            <p className={`fs-12 ${car.isoverweight === 'N' ? 'text-[#05F2DB]' : 'text-red-500'}`}>{car.isoverweight === 'N' ? 'ปกติ' : 'น้ำหนักเกิน'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

/** Vehicle pins for the GPS detail map — icon color by isoverweight/speed,
 *  click opens a popup with plate/company/speed. Must be mounted inside a
 *  `BaseMap`. */
const VehicleMarkerLayer: React.FC<Props> = ({ cars }) => {
  return (
    <>
      {(cars ?? []).map((car, index) => {
        const lngLat = parseCarLocation(car.car_location)
        if (!lngLat) return null
        return (
          <HTMLMarker
            key={`${car.plate_no ?? 'car'}-${index}`}
            lngLat={lngLat}
            anchor='center'
            title={car.plate_no}
            popup={() => <CarPopup car={car} />}
            popupOptions={{ offset: 10, closeButton: false }}
          >
            <Image
              src={getIcon(car)}
              alt={car.plate_no || 'vehicle'}
              width={ICON_WIDTH}
              height={ICON_HEIGHT}
              preview={false}
            />
          </HTMLMarker>
        )
      })}
    </>
  )
}

export default React.memo(VehicleMarkerLayer)
