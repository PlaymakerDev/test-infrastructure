import React from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'

interface Props {

}

const MapSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='h-full w-full'>
      <div className="map-wrapper h-full">
        <BaseMap initialCenter={[101.0, 14.5]} initialZoom={5.4}>
          <ThailandMaskLayer />
        </BaseMap>
      </div>
    </div>
  )
}

export default React.memo<Props>(MapSection)
