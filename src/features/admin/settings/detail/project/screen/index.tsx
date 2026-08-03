"use client"
import { Alert, Spin } from 'antd'
import { useSearchParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import {
  AddCCTVEquipmentModal,
  AddPointModal,
  AddTaskTypeModal,
  CannotDeleteModal,
  ConfirmDeleteModal,
  CrossingCodeModal,
  EditSolutionModal,
  EquipmentCCTVListModal,
  EquipmentSelectModal,
  LiveStreamModal,
  PointTabs,
  RouteTabs,
  TaskTypeTable,
  TitleSection,
  TrafficSignalCameraModal,
  VMSSolutionModal,
} from '../components'
import { ProjectDetailProvider, useProjectDetailContext } from '../context'
import type { Equipment, TaskType } from '../types'
import { SOLUTION_TYPE } from '@/types/manage/solution-api'
import { TbAlertCircle, TbBox } from 'react-icons/tb'
import { Button } from 'antd'
import { TbPlus } from 'react-icons/tb'

type ConfirmDelete =
  | { kind: 'point'; solutionLocationId: number }
  | { kind: 'taskType'; solutionId: number; taskKind: string }
  | { kind: 'equipment'; equipmentId: string }
  | { kind: 'route'; projectRoadId: number }

type CannotDelete =
  | { kind: 'point'; taskKinds: string[] }
  | { kind: 'taskType'; taskKind: string; equipmentNames: string[] }
  | { kind: 'equipment'; equipmentName: string; usedIn: string[] }

const DetailContent: React.FC = () => {
  const {
    project,
    activeRoute,
    activePoint,
    activePointTaskTypes,
    activePointCameras,
    isLoading,
    isError,
    errorMessage,
    removePoint,
    removeTaskType,
  } = useProjectDetailContext()

  const [pointModal, setPointModal] = useState<{ open: boolean; editingId: number | null }>({
    open: false,
    editingId: null,
  })
  const [addTaskTypeOpen, setAddTaskTypeOpen] = useState(false)
  const [equipmentListModal, setEquipmentListModal] = useState<TaskType | null>(null)
  const [equipmentSelectModal, setEquipmentSelectModal] = useState<TaskType | null>(null)
  const [trafficPickerTask, setTrafficPickerTask] = useState<TaskType | null>(null)
  const [vmsProvisionTask, setVmsProvisionTask] = useState<TaskType | null>(null)
  const [editTask, setEditTask] = useState<TaskType | null>(null)
  const [addEquipmentTaskId, setAddEquipmentTaskId] = useState<number | null>(null)
  const [liveStreamEquipment, setLiveStreamEquipment] = useState<Equipment | null>(null)
  const [crossingCodeTask, setCrossingCodeTask] = useState<TaskType | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null)
  const [cannotDelete, setCannotDelete] = useState<CannotDelete | null>(null)

  // The "no equipment anywhere" banner shows only if the currently active
  // point (the one whose task types are loaded) has 0 solutions AND no
  // other route has any points. Anything else we can't know without a
  // fan-out fetch.
  const projectHasAnyEquipment = useMemo(() => {
    if (activePointTaskTypes.length > 0) return true
    return project.routes.some((r) =>
      r.points.some((p) => (p.taskTypes?.length ?? 0) > 0),
    )
  }, [activePointTaskTypes, project.routes])

  const handleDeletePoint = () => {
    if (!activePoint) return
    if (activePointTaskTypes.length > 0) {
      setCannotDelete({
        kind: 'point',
        taskKinds: activePointTaskTypes.map((t) => t.kind),
      })
      return
    }
    setConfirmDelete({ kind: 'point', solutionLocationId: activePoint.id })
  }

  const handleDeleteTaskType = (task: TaskType) => {
    // CCTV: cameras are point-scoped (not solution-scoped) — we don't
    //   fetch per-solution camera lists. Assume deletable if the point
    //   has no CCTV cameras. Backend enforces FK anyway.
    // Non-CCTV: solutions in the current context haven't preloaded their
    //   attached cameras; delete goes through and backend cascade handles it.
    if (task.kindId === SOLUTION_TYPE.CCTV && activePointCameras.length > 0) {
      setCannotDelete({
        kind: 'taskType',
        taskKind: task.kind,
        equipmentNames: activePointCameras.map((e) => e.name),
      })
      return
    }
    setConfirmDelete({ kind: 'taskType', solutionId: task.id, taskKind: task.kind })
  }

  const executeDelete = async () => {
    if (!confirmDelete) return
    try {
      if (confirmDelete.kind === 'point')
        await removePoint(confirmDelete.solutionLocationId)
      else if (confirmDelete.kind === 'taskType')
        await removeTaskType(confirmDelete.solutionId)
      // Route/equipment delete flows aren't wired yet — placeholder.
    } finally {
      setConfirmDelete(null)
    }
  }

  const openEquipmentModal = (task: TaskType) => {
    // Route the camera-picker per solution type. CCTV opens the read-only
    // list (add via /cctv/cameras). Traffic Signal needs phase + camera_type
    // per row → dedicated picker. VMS needs a desktop-screen URL alongside the
    // camera picks → dedicated modal on
    // /solution/vms/solution/existing_camera. Everything else routes
    // to the generic replace-on-write picker.
    if (task.kindId === SOLUTION_TYPE.CCTV) setEquipmentListModal(task)
    else if (task.kindId === SOLUTION_TYPE.Traffic) setTrafficPickerTask(task)
    else if (task.kindId === SOLUTION_TYPE.VMS) setVmsProvisionTask(task)
    else setEquipmentSelectModal(task)
  }

  if (isLoading) {
    return (
      <div className='main-screen px-10 pb-10 flex items-center justify-center' style={{ minHeight: 400 }}>
        <Spin size='large' />
      </div>
    )
  }

  if (isError) {
    return (
      <div className='main-screen px-10 pb-10'>
        <Alert type='error' message={errorMessage ?? 'ไม่สามารถโหลดข้อมูลโครงการได้'} />
      </div>
    )
  }

  const emptyPoints = (
    <div
      className='rounded-2xl p-10 flex flex-col items-center justify-center'
      style={{ border: '2px dashed #66AEFF' }}
    >
      <TbBox size={44} className='text-(--default-blue) mb-3' />
      <p className='text-white/70 mb-3'>เริ่มเพิ่มและจัดการอุปกรณ์ในตำแหน่งนี้</p>
      <Button
        size='middle'
        shape='round'
        icon={<TbPlus />}
        onClick={() => setPointModal({ open: true, editingId: null })}
        style={{ background: 'var(--yellow)', color: '#000', borderColor: 'var(--yellow)', fontWeight: 700 }}
      >
        เพิ่มจุดติดตั้ง
      </Button>
    </div>
  )

  return (
    <div className='main-screen px-10 pb-10'>
      <TitleSection />
      <RouteTabs />

      <section
        className='mt-5 rounded-2xl p-5'
        style={{ background: '#191919', border: '1px solid var(--light-gray-2)' }}
      >
        {activeRoute && activeRoute.points.length > 0 ? (
          <>
            <PointTabs onAddPoint={() => setPointModal({ open: true, editingId: null })} />
            <div className='mt-4'>
              {activePoint ? (
                <TaskTypeTable
                  point={activePoint}
                  onEditPoint={() => setPointModal({ open: true, editingId: activePoint.id })}
                  onDeletePoint={handleDeletePoint}
                  onAddTaskType={() => setAddTaskTypeOpen(true)}
                  onEditTaskType={setEditTask}
                  onDeleteTaskType={handleDeleteTaskType}
                  onOpenEquipment={openEquipmentModal}
                  onOpenCrossingCode={setCrossingCodeTask}
                />
              ) : (
                emptyPoints
              )}
            </div>
          </>
        ) : (
          emptyPoints
        )}
      </section>

      {!projectHasAnyEquipment && (
        <section
          className='mt-4 rounded-2xl p-6 text-center'
          style={{ border: '2px dashed #FF6666' }}
        >
          <TbAlertCircle size={40} className='text-(--red) mx-auto mb-2' />
          <p className='text-white/70 mb-1'>
            คุณสามารถลบโครงการนี้ได้ เนื่องจากไม่มีจุดติดตั้งในโครงการนี้
          </p>
          <a href='/admin/settings' className='text-(--red) underline font-semibold'>
            คุณต้องการลบโครงการหรือไม่ ?
          </a>
        </section>
      )}

      <AddPointModal
        open={pointModal.open}
        editingPointId={pointModal.editingId}
        onClose={() => setPointModal({ open: false, editingId: null })}
      />
      <AddTaskTypeModal open={addTaskTypeOpen} onClose={() => setAddTaskTypeOpen(false)} />
      <AddCCTVEquipmentModal
        open={addEquipmentTaskId != null}
        taskId={addEquipmentTaskId}
        onClose={() => setAddEquipmentTaskId(null)}
      />
      <EquipmentCCTVListModal
        open={!!equipmentListModal}
        task={equipmentListModal}
        projectName={project.name}
        onClose={() => setEquipmentListModal(null)}
        onAdd={() => equipmentListModal && setAddEquipmentTaskId(equipmentListModal.id)}
        onOpenLiveStream={setLiveStreamEquipment}
      />
      <EquipmentSelectModal
        open={!!equipmentSelectModal}
        task={equipmentSelectModal}
        projectName={project.name}
        onClose={() => setEquipmentSelectModal(null)}
        onOpenLiveStream={setLiveStreamEquipment}
      />
      <TrafficSignalCameraModal
        open={!!trafficPickerTask}
        task={trafficPickerTask}
        projectName={project.name}
        onClose={() => setTrafficPickerTask(null)}
        onOpenLiveStream={setLiveStreamEquipment}
      />
      <VMSSolutionModal
        open={!!vmsProvisionTask}
        task={vmsProvisionTask}
        projectName={project.name}
        onClose={() => setVmsProvisionTask(null)}
        onOpenLiveStream={setLiveStreamEquipment}
      />
      <EditSolutionModal
        open={!!editTask}
        task={editTask}
        onClose={() => setEditTask(null)}
      />
      <LiveStreamModal
        open={!!liveStreamEquipment}
        equipment={liveStreamEquipment}
        pointLabel={`${activeRoute?.code ?? ''} ${activePoint?.name ?? ''}`}
        onClose={() => setLiveStreamEquipment(null)}
      />
      <CrossingCodeModal
        open={!!crossingCodeTask}
        task={crossingCodeTask}
        onClose={() => setCrossingCodeTask(null)}
      />

      <ConfirmDeleteModal
        open={confirmDelete?.kind === 'point'}
        title='ยืนยันลบจุดติดตั้งหรือไม่?'
        subtitle='ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้'
        onCancel={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        bodyNode={
          <div className='fs-12 text-black text-center py-2'>
            <p className='font-bold mb-1'>จุดติดตั้ง : {activePoint?.name}</p>
            <p className='mb-0'>ไม่มีประเภทงานหรืออุปกรณ์ที่ใช้งานอยู่ในจุดติดตั้งนี้</p>
            <p className='mb-0'>สามารถลบจุดติดตั้งออกจากระบบได้อย่างปลอดภัย</p>
          </div>
        }
      />
      <ConfirmDeleteModal
        open={confirmDelete?.kind === 'taskType'}
        title='ยืนยันลบประเภทงานหรือไม่?'
        subtitle='ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้'
        onCancel={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        bodyNode={
          <div className='fs-12 text-black text-center py-2'>
            <p className='mb-0'>ยืนยันการลบประเภทงาน</p>
            {confirmDelete?.kind === 'taskType' && (
              <p className='font-bold mb-0'>{confirmDelete.taskKind}</p>
            )}
          </div>
        }
      />

      <CannotDeleteModal
        open={cannotDelete?.kind === 'point'}
        title='ไม่สามารถลบจุดติดตั้งได้'
        subtitleNode={
          <>
            เนื่องจากระบบตรวจพบประเภทงาน{' '}
            <span className='text-red-500 font-semibold'>
              {(cannotDelete?.kind === 'point' && cannotDelete.taskKinds.length) || 0} ประเภท
            </span>
          </>
        }
        onClose={() => setCannotDelete(null)}
        bodyNode={
          <div className='fs-12 text-black text-center'>
            <p className='mb-2'>
              จุดติดตั้งนี้ไม่สามารถลบได้ เนื่องจากยังมีข้อมูลประเภทงาน
              <br />
              กรุณาลบ <span className='underline'>ประเภทงาน</span> ก่อน จึงจะสามารถลบจุดติดตั้งได้
            </p>
            <div className='flex gap-2 justify-center flex-wrap'>
              {cannotDelete?.kind === 'point' &&
                cannotDelete.taskKinds.map((k, i) => (
                  <span
                    key={i}
                    className='inline-flex px-3 py-1 rounded-full fs-12'
                    style={{ background: '#F59E0B', color: '#000' }}
                  >
                    {k}
                  </span>
                ))}
            </div>
          </div>
        }
      />
      <CannotDeleteModal
        open={cannotDelete?.kind === 'taskType'}
        title='ไม่สามารถลบประเภทงานได้'
        subtitleNode={
          <>
            เนื่องจากระบบตรวจพบอุปกรณ์{' '}
            <span className='text-red-500 font-semibold'>
              {(cannotDelete?.kind === 'taskType' && cannotDelete.equipmentNames.length) || 0} อุปกรณ์
            </span>
          </>
        }
        onClose={() => setCannotDelete(null)}
        bodyNode={
          <div className='fs-12 text-black'>
            {cannotDelete?.kind === 'taskType' && (
              <>
                <p className='mb-1'>
                  ประเภทงาน <span className='font-semibold'>{cannotDelete.taskKind}</span> มีอุปกรณ์ที่ใช้งาน ดังนี้:
                </p>
                <ul className='list-disc pl-5'>
                  {cannotDelete.equipmentNames.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        }
      />
    </div>
  )
}

const SettingProjectDetailScreen: React.FC = () => {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id') ?? ''

  return (
    <ProjectDetailProvider projectId={projectId}>
      <DetailContent />
    </ProjectDetailProvider>
  )
}

export default React.memo(SettingProjectDetailScreen)
