"use client"
import React, { useCallback, useMemo } from 'react'
import { TbMapPin } from 'react-icons/tb'
import { useGPSContext } from '../../../context'
import Image from 'next/image'
import { Button } from 'antd'
import type { ButtonColorType } from 'antd/es/button/buttonHelpers'
import { motion } from 'motion/react'
import { GeoRoadData, VehicleLocationData } from '@/types/tracking/detail-gps-api'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  road?: GeoRoadData
  vehicle?: VehicleLocationData
}

interface VehicleStatus {
  img: string
  label: string
  color: ButtonColorType
  labelClass: string
  key: string
  count: number
  /** Tab key in `LicenseTabContent` this status should open to by default. */
  tabKey: string
}

const VEHICLE_STATUSES: VehicleStatus[] = [
  {
    img: '/atlas/images/vehicles/status/green_vehicle.png',
    label: 'รถเคลื่อนที่',
    color: 'lime',
    labelClass: 'text-lime-500',
    key: 'moving',
    count: 0,
    tabKey: '2',
  },
  {
    img: '/atlas/images/vehicles/status/orange_vehicle.png',
    label: 'รถจอด',
    color: 'orange',
    labelClass: 'text-orange-500',
    key: 'parked',
    count: 0,
    tabKey: '3',
  },
  {
    img: '/atlas/images/vehicles/status/red_vehicle.png',
    label: 'รถน้ำหนักเกิน',
    color: 'red',
    labelClass: 'text-red-500',
    key: 'overweight',
    count: 0,
    tabKey: '4',
  },
]

const RouteDetail: React.FC<Props> = (props) => {
  const { road, vehicle } = props
  const { setLicenseOpen, setLicenseTab } = useGPSContext()

  const countData = useMemo(() => {
    return VEHICLE_STATUSES.map((item) => {
      let count
      if (item.label === "รถเคลื่อนที่") count = vehicle?.vehicle_count.normal_vehicle_count
      if (item.label === "รถจอด") count = vehicle?.vehicle_count.not_moving_count
      if (item.label === "รถน้ำหนักเกิน") count = vehicle?.vehicle_count.over_weight_history
      return {
        ...item,
        count: fmtNumber(Number(count)) || 0
      }
    })
  }, [vehicle?.vehicle_count])

  const renderDeptBureau = useCallback((deptName: string, bureauName: string) => {
    const arr = [deptName, bureauName]
    return arr.join(' ').trim().replace(/\s+/g, ' ')
  }, [])

  return (
    <motion.section
      className='absolute bottom-5 left-5 right-5'
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className='bg-black/50 p-5 rounded-lg flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>

        {/* Route Info */}
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <TbMapPin className='text-(--yellow) fs-24' />
            <h3 className='text-(--yellow) font-normal!'>สายทาง {road?.road_code || '-'}</h3>
          </div>
          <p>{road?.route_name || '-'}</p>
          <p className='fs-12 text-(--yellow)'>{renderDeptBureau(road?.dept_name || '-', road?.bureau_name || '-')}</p>
          <p className='fs-12 text-gray-400'>จังหวัด {road?.province || '-'}</p>
          <p className='fs-12 text-(--default-blue)'>ระยะทาง {fmtNumber(Number(road?.length_drr), 3) || 0}</p>
        </div>

        {/* Vehicle Status Cards */}
        <div className='grid grid-cols-3 gap-4 lg:flex lg:gap-6 lg:shrink-0'>
          {countData.map((status) => (
            <div key={status.key} className='flex flex-col items-center gap-2'>
              <Image
                src={status.img}
                alt={status.label}
                width={90}
                height={55}
                className='object-contain'
                unoptimized
              />
              <p className={`fs-12 text-center ${status.labelClass}`}>
                {status.label}
              </p>
              <Button
                color={status.color}
                variant='solid'
                shape='round'
                block
                onClick={() => {
                  setLicenseTab(status.tabKey)
                  setLicenseOpen(true)
                }}
              >
                <span className='font-bold'>{status.count}</span>
              </Button>
            </div>
          ))}
        </div>

      </div>
    </motion.section>
  )
}

export default React.memo(RouteDetail)
