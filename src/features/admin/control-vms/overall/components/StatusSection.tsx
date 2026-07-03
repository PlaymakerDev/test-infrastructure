import React from 'react'
import { ContentTab, ModalStatusVMSScreen, ModalUpdateSchedule, SearchStatusSection } from '../components'

interface Props {

}

const StatusSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='px-10'>
      <div className='mb-5 lg:mb-0 lg:hidden'>
        <SearchStatusSection />
      </div>
      <ContentTab />
      <ModalStatusVMSScreen />
      <ModalUpdateSchedule />
    </div>
  )
}

export default React.memo<Props>(StatusSection)
