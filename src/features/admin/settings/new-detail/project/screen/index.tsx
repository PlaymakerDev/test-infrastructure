"use client"
import React, { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import ModalCreateProject from '@/features/admin/settings/overall/components/new-project/ModalCreateProject'

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
  const queryClient = useQueryClient()

  // TitleSection reads the project + its roads under hand-written keys that
  // useUpdateProject doesn't invalidate — refresh them so a road added via
  // the project modal shows up immediately.
  const onProjectUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['project', id] })
    queryClient.invalidateQueries({ queryKey: ['roadSolution', id] })
  }, [queryClient, id])

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
      <ModalCreateProject onSuccess={onProjectUpdated} />
      {/* Last, so the viewer stacks above the equipment modals that open it. */}
      <ModalLiveStream />
    </ProjectProvider>
  )
}

export default React.memo<Props>(ProjectDetailScreen)
