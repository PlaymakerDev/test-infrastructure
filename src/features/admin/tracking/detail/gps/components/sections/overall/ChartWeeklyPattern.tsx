import React from 'react'
import BarChart from '@/components/chart/Barchart'

interface Props {

}

const ChartWeeklyPattern: React.FC<Props> = (props) => {
  const { } = props

  return (
    <BarChart
      bars={[]}
      data={[]}
      cardBorderColor='transparent'
    />

  )
}

export default React.memo<Props>(ChartWeeklyPattern)
