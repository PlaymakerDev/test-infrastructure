import React from 'react'
import { LocationSection, DataDisplaySection } from '../components'

interface Props {
  deptId?: string | string[] | number
}

const LPRSection: React.FC<Props> = (props) => {
  const { deptId } = props

  return (
    <div className='px-10'>
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

export default React.memo<Props>(LPRSection)
