"use client"
import React from 'react'
import LineChart from '@/components/chart/LineChart'
import { TbCalendarStats } from 'react-icons/tb'

// Thai fiscal year: October → September
const DATA = [
  { label: 'ตุลาคม', plan: 60, actual: 70, diff: 10 },
  { label: 'พฤศจิกายน', plan: 130, actual: 175, diff: 45 },
  { label: 'ธันวาคม', plan: 173, actual: 474, diff: 301 },
  { label: 'มกราคม', plan: 210, actual: 215, diff: 5 },
  { label: 'กุมภาพันธ์', plan: 265, actual: 240, diff: -25 },
  { label: 'มีนาคม', plan: 440, actual: 400, diff: -40 },
  { label: 'เมษายน', plan: 620, actual: 580, diff: -40 },
  { label: 'พฤษภาคม', plan: 790, actual: 755, diff: -35 },
  { label: 'มิถุนายน', plan: 940, actual: 910, diff: -30 },
  { label: 'กรกฎาคม', plan: 1070, actual: 1055, diff: -15 },
  { label: 'สิงหาคม', plan: 1215, actual: 1195, diff: -20 },
  { label: 'กันยายน', plan: 1380, actual: 1260, diff: -120 },
]

const LINES = [
  { dataKey: 'plan', color: '#4ADE80', label: 'แผนการดำเนินงาน' },
  { dataKey: 'actual', color: '#F472B6', label: 'ผลการดำเนินงาน' },
]

const ChartMobileUnitPlan: React.FC = () => {
  return (
    <LineChart
      title='แผนงานและผลการจัดตั้งหน่วยชั่งเคลื่อนที่'
      subtitle='ประจำปีงบประมาณ 2569'
      icon={<TbCalendarStats className='fs-22 shrink-0' />}
      iconCircle={false}
      accentColor='#FCD116'
      cardBackground='#00000080'
      cardBorderColor='transparent'
      showGlow={false}
      data={DATA}
      lines={LINES}
      yAxisDomain={[0, 1400]}
      yAxisTicks={[0, 200, 400, 600, 800, 1000, 1200, 1400]}
      tooltipShowDot
      tooltipExtras={[
        { dataKey: 'diff', label: 'เปรียบเทียบแผน-ผล', color: '#8a9ab5' },
      ]}
      height={280}
    />
  )
}

export default React.memo(ChartMobileUnitPlan)
