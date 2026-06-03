import React, { useMemo, useState } from 'react'
import { TitleSection, OverallSection, ControlSection } from '../components'
import { DetailProvider } from '../context'

interface Props {
  id?: string | string[]
}

const VMSDetailScreen: React.FC<Props> = (props) => {
  const { } = props

  return (
    <DetailProvider>
      <div className='main-screen'>
        <TitleSection />
        <section className='mt-8'>
          <OverallSection />
        </section>
      </div>
    </DetailProvider>
  )
}

export default React.memo<Props>(VMSDetailScreen)
