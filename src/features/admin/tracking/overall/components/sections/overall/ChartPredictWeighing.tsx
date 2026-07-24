import LineChart from '@/components/chart/LineChart'
import { FlexArrowIcon } from '@/components/icon'
import { useSumWeightYearV2 } from '@/features/admin/tracking/overall/hooks'
import { Empty, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { TbArrowsExchange } from 'react-icons/tb'

interface Props { }

const ChartPredictWeighing: React.FC<Props> = () => {
  const { data, isLoading, isError } = useSumWeightYearV2({})

  const chartData = useMemo(() => {
    const items = data?.data?.data?.data ?? []
    return [...items]
      .sort((a, b) => a.year_total - b.year_total)
      .map((item) => ({
        label: String(item.year_total),
        station: item.station_total,
        wim: item.wim_total,
        mobile: item.spot_check_total,
      }))
  }, [data])

  const summary = data?.data?.data?.summary?.[0]

  const renderChart = useMemo(() => {
    if (isLoading) return <Skeleton loading active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <LineChart
        title='แนวโน้มจำนวนรถเข้าชั่ง 10 ปีล่าสุด'
        subtitle='เปรียบเทียบจำนวนรถเข้าชั่งแยกตามประเภท (สถานีตรวจสอบน้ำหนัก  WIM และหน่วยตรวจสอบน้ำหนักเคลื่อนที่)'
        icon={<FlexArrowIcon />}
        iconCircle={false}
        accentColor='var(--default-blue)'
        cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        data={chartData}
        lines={
          [
            { dataKey: 'station', color: '#FCD116', label: 'สถานีตรวจสอบน้ำหนัก' },
            { dataKey: 'wim', color: '#4ADE80', label: 'WIM (Weight-In-Motion)' },
            { dataKey: 'mobile', color: '#E94C4C', label: 'หน่วยตรวจสอบน้ำหนักเคลื่อนที่' },
          ]}
        stats={
          [
            { value: summary ? Number(summary.station_total).toLocaleString() : '-', label: 'สถานีตรวจสอบน้ำหนัก', color: '#FCD116' },
            { value: summary ? Number(summary.wim_total).toLocaleString() : '-', label: 'WIM (Weight-In-Motion)', color: '#4ADE80' },
            { value: summary ? Number(summary.spot_check_total).toLocaleString() : '-', label: 'หน่วยตรวจสอบน้ำหนักเคลื่อนที่', color: '#E94C4C' },
          ]}
        height={260}
        tooltipShowDot
      />
    )
  }, [isLoading, isError, chartData, summary])

  return renderChart
}

export default React.memo<Props>(ChartPredictWeighing)
