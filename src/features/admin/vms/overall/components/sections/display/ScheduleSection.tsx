import React from 'react'
import { FormSearchCalendar } from '../../../components'

interface Props {

}

const ScheduleSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <h3>ตารางเวลาเดือนนี้</h3>
    </div>
  )
}

export default React.memo<Props>(ScheduleSection)
