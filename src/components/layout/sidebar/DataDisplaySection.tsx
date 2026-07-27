import { Empty } from 'antd'
import React from 'react'

interface Props {

}

const DataDisplaySection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <Empty description="กรุณากรอกสายที่ต้องการค้นหา" />
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
