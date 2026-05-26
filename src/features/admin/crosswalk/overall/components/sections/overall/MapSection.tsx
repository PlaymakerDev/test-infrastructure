import { MapBridgeLighting } from '@/features/admin/bridge-lighting/overall/components'
import React from 'react'

interface Props {

}

const MapSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <MapBridgeLighting
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      />
    </div>
  )
}

export default React.memo<Props>(MapSection)
