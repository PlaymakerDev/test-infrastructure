import React from 'react'
import { TitleSection, OverallSection } from '../components'
import { DetailProvider } from '../context'

interface Props {
  id?: string | string[]
}

const DetailScreen: React.FC<Props> = ({ id }) => {
  return (
    <DetailProvider id={id}>
      <div className='main-screen flex flex-col'>
        <TitleSection />
        <section className='mt-5 flex-1 min-h-0'>
          <OverallSection />
        </section>
      </div>
    </DetailProvider>
  )
}

export default React.memo<Props>(DetailScreen)
