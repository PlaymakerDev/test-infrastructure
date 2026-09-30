"use client"
import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { App } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { ProjectProvider, errText } from '@/features/admin/settings/new-detail/project/context'
import { useDeleteProject } from '@/hooks/queries/manage'
import { useAppDispatch } from '@/stores/hooks'
import { resetProjectModalData } from '@/stores/reducers/modal/customModalSlice'
import {
  EquipmentCCTVListModal,
  EquipmentSelectModal,
  MainContent,
  ModalConfirmDelete,
  ModalCreateDevice,
  ModalLightingDiagram,
  ModalLiveStream,
  ModalViewCCTV,
  ModalViewCrossingCode,
  TitleSection,
  TrafficSignalCameraModal,
  VMSSolutionModal,
} from '../components'
import ModalCreateProject from '@/features/admin/settings/overall/components/new-project/ModalCreateProject'
import ModalConfirmDeleteProject from '@/features/admin/settings/overall/components/new-project/ModalConfirmDelete'
import { ProjectInfoModal } from '@/components/modal'

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

  // EmptyRoadSolution's "คุณต้องการลบโครงการหรือไม่ ?" — same flow as the
  // settings table's trash icon (NewProjectSection), except that the page it
  // runs on goes away with the project: return to the list, replacing this
  // entry so Back can't land on the deleted project.
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { message } = App.useApp()
  const { mutate: deleteProject, isPending: isDeletePending } = useDeleteProject()
  const onDeleteProject = useCallback((projectId: number) => {
    deleteProject(projectId, {
      onSuccess: () => {
        message.success('ลบโครงการสำเร็จ')
        dispatch(resetProjectModalData())
        router.replace('/admin/settings?tab=PROJECT')
      },
      onError: (error) => {
        message.error(errText(error, 'ลบโครงการไม่สำเร็จ'))
      },
    })
  }, [deleteProject, dispatch, message, router])

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
      <ModalLightingDiagram />
      {/* The full project form (opened from ModalAddRoad when the project is
          missing a field the update needs) and EmptyRoadSolution's ลบโครงการ. */}
      <ModalCreateProject onSuccess={onProjectUpdated} />
      <ModalConfirmDeleteProject onDelete={onDeleteProject} isPending={isDeletePending} />
      {/* Last, so the viewer stacks above the equipment modals that open it. */}
      <ModalLiveStream />
      <ProjectInfoModal />
    </ProjectProvider>
  )
}

export default React.memo<Props>(ProjectDetailScreen)
