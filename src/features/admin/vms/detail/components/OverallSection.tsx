import React from 'react'
import { LocationSection } from '../components'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'

interface Props {
  data?: APIResponseVMSDetail
  isWarranty?: boolean
  isOnline?: boolean
}

const OverallSection: React.FC<Props> = (props) => {
  const { data, isWarranty, isOnline } = props

  return (
    <div>
      <section>
        <LocationSection
          data={data}
          isWarranty={isWarranty}
          isOnline={isOnline}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
