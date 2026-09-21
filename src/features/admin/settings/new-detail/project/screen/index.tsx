"use client"
import React from 'react'
import { ProjectProvider } from '@/features/admin/settings/new-detail/project/context'
import {
  EquipmentCCTVListModal,
  EquipmentSelectModal,
  MainContent,
  ModalConfirmDelete,
  ModalCreateDevice,
  ModalLiveStream,
  ModalViewCCTV,
  ModalViewCrossingCode,
  TitleSection,
  TrafficSignalCameraModal,
  VMSSolutionModal,
} from '../components'

interface Props {
  id?: string | string[]
}

const ProjectDetailContent: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='main-screen'>
      <TitleSection />
      <section className='mt-8 px-8 lg:px-18'>
        <MainContent />
      </section>
    </div>
  )
}

const ProjectDetailScreen: React.FC<Props> = (props) => {
  const { id } = props

  return (
    <ProjectProvider
      id={id}
    >
      <ProjectDetailContent />
      <ModalCreateDevice />
      <ModalViewCCTV />
      <EquipmentCCTVListModal />
      <EquipmentSelectModal />
      <TrafficSignalCameraModal />
      <VMSSolutionModal />
      <ModalViewCrossingCode />
      <ModalConfirmDelete />
      {/* Last, so the viewer stacks above the equipment modals that open it. */}
      <ModalLiveStream />
    </ProjectProvider>
  )
}

export default React.memo<Props>(ProjectDetailScreen)
