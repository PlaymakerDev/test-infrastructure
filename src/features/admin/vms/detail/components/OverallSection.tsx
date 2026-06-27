import React from 'react'
import { LocationSection } from '../components'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'

interface Props {
  data?: APIResponseVMSDetail
}

const OverallSection: React.FC<Props> = (props) => {
  const { data } = props

  return (
    <div>
      <section>
        <LocationSection
          data={data}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
