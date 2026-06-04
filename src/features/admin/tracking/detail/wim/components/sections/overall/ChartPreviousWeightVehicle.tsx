"use client"
import React, { useState } from 'react'
import LineChart from '@/components/chart/LineChart'
import { TbCalendarMonth } from 'react-icons/tb'

type Period = 'วันนี้' | 'เดือน' | 'ปี'

const LINES = [
  { dataKey: 'current', color: '#66AEFF', label: 'สัปดาห์ปัจจุบัน' },
  { dataKey: 'previous', color: '#E94C4C', label: 'สัปดาห์ก่อน' },
]

const DATA_MAP: Record<Period, { label: string; current: number; previous: number }[]> = {
  'วันนี้': [
    { label: 'จ.', current: 3400, previous: 1200 },
    { label: 'อ.', current: 2600, previous: 800 },
    { label: 'พ.', current: 4200, previous: 1400 },
    { label: 'พฤ.', current: 2853, previous: 1374 },
    { label: 'ศ.', current: 2200, previous: 1000 },
    { label: 'ส.', current: 3400, previous: 1300 },
    { label: 'อา.', current: 2500, previous: 1100 },
  ],
  'เดือน': [
    { label: 'ม.ค.', current: 82000, previous: 70000 },
    { label: 'ก.พ.', current: 74000, previous: 65000 },
    { label: 'มี.ค.', current: 91000, previous: 80000 },
    { label: 'เม.ย.', current: 68000, previous: 60000 },
    { label: 'พ.ค.', current: 95000, previous: 85000 },
    { label: 'มิ.ย.', current: 88000, previous: 75000 },
    { label: 'ก.ค.', current: 77000, previous: 68000 },
    { label: 'ส.ค.', current: 93000, previous: 82000 },
    { label: 'ก.ย.', current: 85000, previous: 74000 },
    { label: 'ต.ค.', current: 79000, previous: 69000 },
    { label: 'พ.ย.', current: 90000, previous: 78000 },
    { label: 'ธ.ค.', current: 72000, previous: 63000 },
  ],
  'ปี': [
    { label: '2564', current: 850000, previous: 780000 },
    { label: '2565', current: 920000, previous: 850000 },
    { label: '2566', current: 980000, previous: 900000 },
    { label: '2567', current: 1050000, previous: 970000 },
    { label: '2568', current: 1100000, previous: 1020000 },
    { label: '2569', current: 870000, previous: 800000 },
  ],
}

const ChartPreviousWeightVehicle: React.FC = () => {
  const [period, setPeriod] = useState<Period>('วันนี้')

  return (
    <LineChart
      title='เปรียบเทียบรถเข้าชั่งน้ำหนัก'
      subtitle='แนวโน้มย้อนหลัง 7 วัน'
      icon={<TbCalendarMonth size={18} />}
      iconCircle={false}
      accentColor='#FCD116'
      cardBackground='#00000080'
      cardBorderColor='transparent'
      showGlow={false}
      data={DATA_MAP[period]}
      lines={LINES}
      periods={['วันนี้', 'เดือน', 'ปี']}
      defaultPeriod='วันนี้'
      onPeriodChange={(p) => setPeriod(p as Period)}
      tooltipShowDot
      height={260}
    />
  )
}

export default React.memo(ChartPreviousWeightVehicle)
