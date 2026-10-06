import React, { useMemo } from 'react'
import { TbVideo } from 'react-icons/tb'
import BarChart, { type BarChartDataPoint } from '@/components/chart/Barchart'
import { useLPRDetailContext } from '../../../context'
import { useQuery } from '@tanstack/react-query'
import { Empty, Skeleton } from 'antd'
import { getLPRDailyCountAPI } from '@/services/routes/NewLPRService'
import dayjs from 'dayjs'

interface Props {

}

// each camera keeps its own bar color (cycled by row) like the reference design
const CAMERA_COLORS = ['#00E5CC', '#B5FF3B', '#FCD116', '#FF9F40']

const ChartLicensePerCam: React.FC<Props> = () => {
  const { solutionId } = useLPRDetailContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lpr-daily-count', solutionId],
    queryFn: () => getLPRDailyCountAPI(solutionId, {
      date: dayjs().format('YYYY-MM-DD')
    }),
    enabled: !!solutionId,
  })

  const cameras = useMemo<BarChartDataPoint[]>(
    () => (data?.data?.cameras ?? []).map((cam, i) => ({
      label: cam.camera_name || cam.camera_id,
      count: { value: cam.count, color: CAMERA_COLORS[i % CAMERA_COLORS.length] },
    })),
    [data],
  )

  if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 6 }} />
  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return (
    <BarChart
      title='เปรียบเทียบปริมาณป้ายทะเบียนต่อกล้องประจำวัน'
      icon={<TbVideo className='fs-22 text-(--yellow)' />}
      cardBorderColor='#00000080'
      iconCircle={false}
      layout='horizontal'
      // real camera names are long — truncate with … on the axis (full name stays in the tooltip)
      categoryAxisWidth={140}
      xAxisLabelMaxWidth={130}
      data={cameras}
      bars={[
        { dataKey: 'count', color: '#66AEFF', label: 'ป้ายทะเบียน' },
      ]}
      tooltipUnit='คัน'
    />
  )
}

export default React.memo<Props>(ChartLicensePerCam)
