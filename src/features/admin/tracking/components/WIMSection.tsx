import React from 'react'
import { StatInfoCard, TableWIMProject } from '../components'

interface Props {

}

const WIMSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        WIM Section
      </section>
      <section className='mt-5'>
        <StatInfoCard />
      </section>
      <section className='mt-5'>
        <TableWIMProject />
      </section>
    </div>
  )
}

export default React.memo<Props>(WIMSection)
