import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  VMSSection,
  DisplaySection,
  StatusSection
} from '../components'
import { ControlVMSProvider } from '../context'
import { CCTVModal } from '@/components/modal'

interface Props {

}

const ControlVMSScreen: React.FC<Props> = (props) => {
  const { } = props
  const [currentTab, setCurrentTab] = useState('VMS')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'VMS':
        return <VMSSection />
      case 'DISPLAY':
        return <DisplaySection />
      case 'STATUS':
        return <StatusSection />
      default:
        return <VMSSection />
    }
  }, [currentTab])

  return (
    <ControlVMSProvider>
      <div className='main-screen flex flex-col h-[calc(100vh-var(--nav-offset))]'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8 flex-1 min-h-0'>
          {renderContent}
        </section>
      </div>
      <CCTVModal />
    </ControlVMSProvider>
  )
}

export default React.memo<Props>(ControlVMSScreen)
