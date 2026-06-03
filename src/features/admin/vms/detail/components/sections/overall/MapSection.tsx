import BaseMap from '@/components/map/BaseMap'
import React from 'react'

interface Props {}

const MapSection: React.FC<Props> = () => {
  return (
    <div>
      <BaseMap
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      />
    </div>
  )
}

export default React.memo<Props>(MapSection)
