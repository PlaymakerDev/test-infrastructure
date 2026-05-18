import React from 'react'
import {
  CompareInfoSection
} from '@/features/admin/tracking/detail/gps/components'

interface Props {

}

const VehicleOnRouteSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <CompareInfoSection />
    </div>
  )
}

export default React.memo<Props>(VehicleOnRouteSection)
