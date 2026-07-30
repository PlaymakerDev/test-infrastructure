import React from 'react'
import { DataDisplaySection, LocationSection } from '../components'

interface Props {
  deptId?: string | string[] | number
  roadId?: string | string[] | number
}

const OverallSection: React.FC<Props> = (props) => {
  const { deptId, roadId } = props

  return (
    <div>
      <section>
        <LocationSection
          deptId={deptId!}
          roadId={roadId!}
        />
      </section>
      <section className='mt-5'>
        <DataDisplaySection
          deptId={deptId!}
          roadId={roadId!}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
