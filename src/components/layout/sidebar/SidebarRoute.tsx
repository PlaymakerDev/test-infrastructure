import React from 'react'
import FormSearchRoute from './FormSearchRoute'
import DataDisplaySection from './DataDisplaySection'

interface Props {

}

const SidebarRoute: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <FormSearchRoute />
      </section>
      <section className='mt-5'>
        <DataDisplaySection />
      </section>
    </div>
  )
}

export default React.memo<Props>(SidebarRoute)
