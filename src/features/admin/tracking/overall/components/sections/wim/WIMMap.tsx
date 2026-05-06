import React from 'react'
import ReactMap from '@/components/map/ReactMap'

interface Props {

}

const WIMMap: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="h-full">
      <ReactMap />
    </div>
  )
}

export default React.memo<Props>(WIMMap)
