"use client"
import React, { useState } from 'react'
import LineChart from '@/components/chart/LineChart'
import { TbMoon, TbSun } from 'react-icons/tb'

type Period = 'กลางวัน' | 'กลางคืน'

const DATA_DAY = [
  { label: '00.00', total: 480 },
  { label: '01.00', total: 550 },
  { label: '02.00', total: 580 },
  { label: '03.00', total: 270 },
  { label: '04.00', total: 350 },
  { label: '05.00', total: 300 },
  { label: '06.00', total: 320 },
  { label: '07.00', total: 475 },
  { label: '08.00', total: 680 },
  { label: '09.00', total: 480 },
  { label: '10.00', total: 620 },
  { label: '11.00', total: 640 },
  { label: '12.00', total: 280 },
]

const DATA_NIGHT = [
  { label: '12.00', total: 280 },
  { label: '13.00', total: 320 },
  { label: '14.00', total: 380 },
  { label: '15.00', total: 450 },
  { label: '16.00', total: 600 },
  { label: '17.00', total: 720 },
  { label: '18.00', total: 680 },
  { label: '19.00', total: 520 },
  { label: '20.00', total: 380 },
  { label: '21.00', total: 280 },
  { label: '22.00', total: 220 },
  { label: '23.00', total: 380 },
  { label: '24.00', total: 490 },
]

const LINES = [
  { dataKey: 'total', color: '#66AEFF', label: 'รถทั้งหมด' },
]

const ChartTraffic: React.FC = () => {
  const [period, setPeriod] = useState<Period>('กลางวัน')
  const data = period === 'กลางวัน' ? DATA_DAY : DATA_NIGHT

  return (
    <LineChart
      title='ข้อมูลจราจรรายชั่วโมง'
      icon={
        period === 'กลางวัน'
          ? <TbSun size={18} />
          : <TbMoon size={18} />
      }
      iconCircle={false}
      accentColor='#FCD116'
      cardBackground='#00000080'
      cardBorderColor='transparent'
      showGlow={false}
      data={data}
      lines={LINES}
      periods={['กลางวัน', 'กลางคืน']}
      defaultPeriod='กลางวัน'
      onPeriodChange={(p) => setPeriod(p as Period)}
      tooltipDate='24 เม.ย. 2569'
      tooltipUnit='คัน'
      tooltipShowDot
      height={260}
    />
  )
}

export default React.memo(ChartTraffic)
