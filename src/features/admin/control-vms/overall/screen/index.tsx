import React, { useMemo } from 'react'
import {
  TitleSection,
  VMSSection,
  DisplaySection,
  StatusSection
} from '../components'
import { ControlVMSProvider, useControlVMSContext } from '../context'
import { CCTVModal } from '@/components/modal'

interface Props {

}

const ControlVMSContent: React.FC = () => {
  const { currentTab } = useControlVMSContext()

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
    <div className='main-screen flex flex-col h-[calc(100vh-var(--nav-offset))]'>
      <TitleSection />
      <section className='mt-8 flex-1 min-h-0'>
        {renderContent}
      </section>
    </div>
  )
}

const ControlVMSScreen: React.FC<Props> = (props) => {
  const { } = props

  return (
    <ControlVMSProvider>
      <ControlVMSContent />
      <CCTVModal />
    </ControlVMSProvider>
  )
}

export default React.memo<Props>(ControlVMSScreen)
