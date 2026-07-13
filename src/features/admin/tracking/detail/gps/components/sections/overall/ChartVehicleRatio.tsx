import PieChart from '@/components/chart/PieChart'
import React from 'react'
import { TbCar } from 'react-icons/tb'

interface Props {

}

const ChartVehicleRatio: React.FC<Props> = (props) => {
  const { } = props

  return (
    <PieChart
      title='ประเภทยานพาหนะในระบบ'
      icon={<TbCar className='fs-22' />}
      iconCircle={false}
      cardBackground='#00000080'
      cardBorderColor='transparent'
      showGlow={false}
      data={[]}
      height={260}
    />
  )
}

export default React.memo<Props>(ChartVehicleRatio)
