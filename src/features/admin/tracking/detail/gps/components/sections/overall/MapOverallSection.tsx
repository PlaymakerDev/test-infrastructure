import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import React from 'react'

interface Props {

}

const MapOverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='h-200'>
      {/* <BaseMap
        initialCenter={[101.0, 14.5]}
        initialZoom={5.4}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        <ThailandMaskLayer />
      </BaseMap> */}
    </div>
  )
}

export default React.memo<Props>(MapOverallSection)
