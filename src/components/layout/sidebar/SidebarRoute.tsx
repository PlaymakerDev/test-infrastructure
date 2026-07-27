import React, { useState } from 'react'
import FormSearchRoute from './FormSearchRoute'
import DataDisplaySection from './DataDisplaySection'

interface Props {

}

const SidebarRoute: React.FC<Props> = (props) => {
  const { } = props
  const [selectedRoad, setSelectedRoad] = useState<{ id: number; code: string; departmentId: number } | null>(null)

  return (
    <div>
      <section>
        <FormSearchRoute onSelectRoad={setSelectedRoad} />
      </section>
      <section className='mt-5'>
        <DataDisplaySection road={selectedRoad} />
      </section>
    </div>
  )
}

export default React.memo<Props>(SidebarRoute)
