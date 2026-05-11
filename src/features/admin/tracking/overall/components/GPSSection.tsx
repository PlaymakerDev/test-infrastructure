import { Skeleton } from 'antd'
import React from 'react'

interface Props {

}

const GPSSection: React.FC<Props> = (props) => {
  const { } = props

  return <Skeleton loading={true} active paragraph={{ rows: 10 }} />
}

export default React.memo<Props>(GPSSection)
