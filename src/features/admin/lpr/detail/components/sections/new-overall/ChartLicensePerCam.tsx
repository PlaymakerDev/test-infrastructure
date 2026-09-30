import React, { useMemo } from 'react'
import { TbVideo } from 'react-icons/tb'
import BarChart, { type BarChartDataPoint } from '@/components/chart/Barchart'

interface Props {

}

// TODO: mock data — LPR has no per-camera daily count endpoint yet (the
// `/lpr/points/:id/stats` aggregate only breaks down by hour/province/
// vehicle-type, see APIResponseLPRPointStats). Replace with a real hook once
// backend adds one; keep the `{value, color}` shape per row so each camera
// keeps its own bar color like the reference design.
const MOCK_CAMERA_DATA: BarChartDataPoint[] = [
  { label: '69MST-SBR\n2006-LPR001...', count: { value: 102, color: '#00E5CC' } },
  { label: '69MST-SBR\n2006-LPR002...', count: { value: 85, color: '#B5FF3B' } },
  { label: '69MST-SBR\n2006-LPR003...', count: { value: 57, color: '#FCD116' } },
  { label: '69MST-SBR\n2006-LPR004...', count: { value: 76, color: '#FF9F40' } },
]

const ChartLicensePerCam: React.FC<Props> = () => {
  const data = useMemo(() => MOCK_CAMERA_DATA, [])

  return (
    <BarChart
      title='เปรียบเทียบปริมาณป้ายทะเบียนต่อกล้องประจำวัน'
      icon={<TbVideo className='fs-22 text-(--yellow)' />}
      cardBorderColor='#00000080'
      iconCircle={false}
      layout='horizontal'
      data={data}
      bars={[
        { dataKey: 'count', color: '#66AEFF', label: 'ป้ายทะเบียน' },
      ]}
      tooltipUnit='คัน'
    />
  )
}

export default React.memo<Props>(ChartLicensePerCam)
