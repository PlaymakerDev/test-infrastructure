import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import React from 'react'

interface Props {

}

const MapOverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='relative w-full h-202 rounded-lg overflow-hidden'>
      <BaseMap
        initialCenter={[101.0, 14.5]}
        initialZoom={5.4}
        edgeFade={{ all: 10 }}
      >
        <ThailandMaskLayer />
      </BaseMap>
    </div>
  )
}

export default React.memo<Props>(MapOverallSection)
