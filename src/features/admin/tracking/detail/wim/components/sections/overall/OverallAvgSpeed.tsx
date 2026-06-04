import React from 'react'
import GaugeChart from '@/components/chart/GaugeChart'
import { TbGauge } from 'react-icons/tb'

interface Props { }

const OverallAvgSpeed: React.FC<Props> = () => {
  return (
    <GaugeChart
      title='ความเร็วเฉลี่ยวันนี้'
      icon={<TbGauge className='fs-22 text-(--yellow) shrink-0' />}
      value={76.59}
      unit='กม./ชม.'
      min={0}
      max={120}
      tableTitle='ความเร็วเฉลี่ยรายชั่วโมง'
      tableTimeLabel='เวลา'
      tableValueLabel='ความเร็วเฉลี่ย'
      tableRows={[
        { time: '12.00 น.', value: 79.00, unit: 'กม./ชม.', highlighted: true },
        { time: '11.00 น.', value: 77.69, unit: 'กม./ชม.' },
        { time: '10.00 น.', value: 78.79, unit: 'กม./ชม.' },
        { time: '09.00 น.', value: 76.84, unit: 'กม./ชม.' },
        { time: '08.00 น.', value: 74.84, unit: 'กม./ชม.' },
      ]}
      height={270}
    />
  )
}

export default React.memo<Props>(OverallAvgSpeed)
