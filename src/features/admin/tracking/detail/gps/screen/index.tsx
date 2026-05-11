import React from 'react'
import { GPSProvider } from '../context'

interface Props {

}

const GPSDetailScreen: React.FC<Props> = (props) => {
  const { } = props

  return (
    <GPSProvider>
      <div className='main-screen'>
        {/* <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8'>
          {renderContent}
        </section> */}
      </div>
    </GPSProvider>
  )
}

export default React.memo<Props>(GPSDetailScreen)
