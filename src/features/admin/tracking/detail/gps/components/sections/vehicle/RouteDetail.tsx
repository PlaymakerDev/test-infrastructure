"use client"
import React from 'react'
import { TbMapPin } from 'react-icons/tb'
import { useGPSContext } from '../../../context'
import Image from 'next/image'
import { Button } from 'antd'
import type { ButtonColorType } from 'antd/es/button/buttonHelpers'
import { motion } from 'framer-motion'

interface VehicleStatus {
  img: string
  label: string
  color: ButtonColorType
  labelClass: string
  key: string
  count: number
}

const VEHICLE_STATUSES: VehicleStatus[] = [
  {
    img: '/images/vehicles/status/green_vehicle.png',
    label: 'รถเคลื่อนที่',
    color: 'lime',
    labelClass: 'text-lime-500',
    key: 'moving',
    count: 0,
  },
  {
    img: '/images/vehicles/status/orange_vehicle.png',
    label: 'รถจอด',
    color: 'orange',
    labelClass: 'text-orange-500',
    key: 'parked',
    count: 0,
  },
  {
    img: '/images/vehicles/status/red_vehicle.png',
    label: 'รถน้ำหนักเกิน',
    color: 'red',
    labelClass: 'text-red-500',
    key: 'overweight',
    count: 0,
  },
]

const RouteDetail: React.FC = () => {
  const { route, setLicenseOpen } = useGPSContext()

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
            <h3 className='text-(--yellow)'>สายทาง {route.road_code}</h3>
          </div>
          <p>แยกทางหลวงหมายเลข 331 (กม.ที่ 39+650) - ท่าเรือแหลมฉบัง</p>
          <p className='fs-12'>{route.road_name} <span className='text-(--yellow)'>สำนักทางหลวงชนบทที่ 3 (ชลบุรี)</span></p>
          <p className='fs-12 text-gray-400'>จังหวัด ชลบุรี</p>
          <p className='fs-12 text-blue-500'>ระยะทาง 19.070</p>
        </div>

        {/* Vehicle Status Cards */}
        <div className='grid grid-cols-3 gap-4 lg:flex lg:gap-6 lg:shrink-0'>
          {VEHICLE_STATUSES.map((status) => (
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
                onClick={() => setLicenseOpen(true)}
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
