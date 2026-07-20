import PieChart from '@/components/chart/PieChart'
import { getTrackingGPSAnalyticVehicleTypeAPI } from '@/services/routes/TrackingGPSService'
import { useQuery } from '@tanstack/react-query'
import { Empty, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { TbCar } from 'react-icons/tb'

interface Props {

}

// เรียงสีตาม type_desc ที่ backend ส่งมา (ไม่ทราบชุดค่าคงที่ล่วงหน้า จึงไล่สีตาม index)
const PIE_COLORS = ['#00B8FF', '#B026FF', '#FCD116', '#4ADE80', '#66AEFF', '#FF6A00', '#E94C4C']

const ChartVehicleRatio: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytic_vehicle_type'],
    queryFn: () => getTrackingGPSAnalyticVehicleTypeAPI()
  })

  const pieData = useMemo(() => {
    const list = data?.data.data ?? []
    return list.map((item, index) => ({
      name: item.type_desc,
      value: item.count,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }))
  }, [data])

  const total = useMemo(() => pieData.reduce((sum, d) => sum + d.value, 0), [pieData])

  const renderChartData = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 6 }} />
    return (
      <PieChart
        title='ประเภทยานพาหนะในระบบ'
        icon={<TbCar className='fs-22' />}
        iconCircle={false}
        cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        data={pieData}
        centerLabel='ยานพาหนะรวมทั้งหมด'
        centerValue={total.toLocaleString()}
        centerUnit='คัน'
        height={260}
      />
    )
  }, [isLoading, pieData, total])

  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return renderChartData
}

export default React.memo<Props>(ChartVehicleRatio)
