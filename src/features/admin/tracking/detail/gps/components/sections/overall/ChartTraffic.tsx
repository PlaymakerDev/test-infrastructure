import LineChart from '@/components/chart/LineChart'
import React from 'react'
import { TbArrowsExchange, TbTrafficLights } from 'react-icons/tb'

interface Props {

}

const ChartTraffic: React.FC<Props> = (props) => {
  const { } = props

  return (
    <LineChart
      title='รูปแบบการจราจร'
      subtitle='การกระจายตามเวลาและวันบนสายทาง ทช.'
      icon={<TbTrafficLights className='fs-22' />}
      iconCircle={false}
      accentColor='#66AEFF'
      cardBackground='#00000080'
      cardBorderColor='transparent'
      showGlow={false}
      data={[]}
      lines={[
        { dataKey: 'station', color: '#FCD116', label: 'สถานีตรวจสอบน้ำหนัก' },
        { dataKey: 'wim', color: '#4ADE80', label: 'WIM (Weigh-In-Motion)' },
        { dataKey: 'mobile', color: '#E94C4C', label: 'หน่วยตรวจสอบน้ำหนักเคลื่อนที่' },
      ]}
      stats={[]}
      height={260}
      tooltipShowDot
    />
  )
}

export default React.memo<Props>(ChartTraffic)
