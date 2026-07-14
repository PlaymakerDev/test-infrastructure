import React from 'react'
import { DataDisplaySection, LocationSection } from '../components'

interface Props {
  deptId?: string | string[] | number
}

const OverallSection: React.FC<Props> = (props) => {
  const { deptId } = props

  return (
    <div>
      <section>
        <LocationSection
          deptId={deptId!}
        />
      </section>
      <section className='mt-5'>
        <DataDisplaySection
          deptId={deptId!}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
