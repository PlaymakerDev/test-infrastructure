import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  VMSSection,
  DisplaySection
} from '../components'
import { VMSProvider } from '../context'

interface Props {

}

const VMSScreen: React.FC<Props> = (props) => {
  const { } = props
  const [currentTab, setCurrentTab] = useState('VMS')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'VMS':
        return <VMSSection />
      case 'DISPLAY':
        return <DisplaySection />
      default:
        return <VMSSection />
    }
  }, [currentTab])

  return (
    <VMSProvider>
      <div className='main-screen flex flex-col h-[calc(100vh-var(--nav-offset))]'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8 flex-1 min-h-0'>
          {renderContent}
        </section>
      </div>
    </VMSProvider>
  )
}

export default React.memo<Props>(VMSScreen)
