"use client"
import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from 'antd'
import { TbAlertCircle, TbBox, TbPlus } from 'react-icons/tb'
import {
  AddCCTVEquipmentModal,
  AddPointModal,
  AddTaskTypeModal,
  CannotDeleteModal,
  ConfirmDeleteModal,
  CrossingCodeModal,
  EquipmentCCTVListModal,
  EquipmentSelectModal,
  LiveStreamModal,
  PointTabs,
  RouteTabs,
  TaskTypeTable,
  TitleSection,
} from '../components'
import { ProjectDetailProvider, useProjectDetailContext } from '../context'
import type { Equipment, TaskType } from '../types'

type ConfirmDelete =
  | { kind: 'point'; roadId: string; pointId: string }
  | { kind: 'taskType'; roadId: string; pointId: string; taskId: string }
  | { kind: 'equipment'; taskId: string; equipmentId: string }

type CannotDelete =
  | { kind: 'point'; taskKinds: string[] }
  | { kind: 'taskType'; taskKind: string; equipmentNames: string[] }
  | { kind: 'equipment'; equipmentName: string; usedIn: string[] }

const DetailContent: React.FC = () => {
  const {
    project,
    activeRouteId,
    activePointId,
    removePoint,
    removeTaskType,
    removeEquipment,
  } = useProjectDetailContext()

  const [pointModal, setPointModal] = useState<{ open: boolean; editingId: string | null }>({
    open: false,
    editingId: null,
  })
  const [addTaskTypeOpen, setAddTaskTypeOpen] = useState(false)
  const [equipmentListModal, setEquipmentListModal] = useState<TaskType | null>(null)
  const [equipmentSelectModal, setEquipmentSelectModal] = useState<TaskType | null>(null)
  const [addEquipmentTaskId, setAddEquipmentTaskId] = useState<string | null>(null)
  const [liveStreamEquipment, setLiveStreamEquipment] = useState<Equipment | null>(null)
  const [crossingCodeTask, setCrossingCodeTask] = useState<TaskType | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null)
  const [cannotDelete, setCannotDelete] = useState<CannotDelete | null>(null)

  const route = useMemo(
    () => project.routes.find((r) => r.id === activeRouteId),
    [project, activeRouteId],
  )
  const point = useMemo(
    () => route?.points.find((p) => p.id === activePointId) ?? null,
    [route, activePointId],
  )

  const projectHasAnyEquipment = useMemo(
    () =>
      project.routes.some((r) =>
        r.points.some((p) => p.taskTypes.some((t) => t.equipment.length > 0 || (t.equipmentRefs?.length ?? 0) > 0)),
      ),
    [project],
  )

  const handleDeletePoint = () => {
    if (!point) return
    if (point.taskTypes.length > 0) {
      setCannotDelete({ kind: 'point', taskKinds: point.taskTypes.map((t) => t.kind) })
      return
    }
    setConfirmDelete({ kind: 'point', roadId: activeRouteId, pointId: point.id })
  }

  const handleDeleteTaskType = (task: TaskType) => {
    const hasEquipment = task.kind === 'CCTV' ? task.equipment.length > 0 : (task.equipmentRefs?.length ?? 0) > 0
    if (hasEquipment) {
      const equipmentNames =
        task.kind === 'CCTV'
          ? task.equipment.map((e) => e.name)
          : (task.equipmentRefs ?? []).map((id) => {
              const cctv = point?.taskTypes.find((t) => t.kind === 'CCTV')
              return cctv?.equipment.find((e) => e.id === id)?.name ?? id
            })
      setCannotDelete({ kind: 'taskType', taskKind: task.kind, equipmentNames })
      return
    }
    if (!activePointId) return
    setConfirmDelete({ kind: 'taskType', roadId: activeRouteId, pointId: activePointId, taskId: task.id })
  }

  const handleDeleteEquipment = (equipment: Equipment) => {
    const usedIn: string[] = []
    project.routes.forEach((r) =>
      r.points.forEach((p) =>
        p.taskTypes.forEach((t) => {
          if (t.equipmentRefs?.includes(equipment.id)) usedIn.push(t.kind)
        }),
      ),
    )
    if (usedIn.length > 0) {
      setCannotDelete({ kind: 'equipment', equipmentName: equipment.name, usedIn })
      return
    }
    if (!equipmentListModal) return
    setConfirmDelete({ kind: 'equipment', taskId: equipmentListModal.id, equipmentId: equipment.id })
  }

  const executeDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.kind === 'point') removePoint(confirmDelete.roadId, confirmDelete.pointId)
    else if (confirmDelete.kind === 'taskType')
      removeTaskType(confirmDelete.roadId, confirmDelete.pointId, confirmDelete.taskId)
    else if (confirmDelete.kind === 'equipment')
      removeEquipment(confirmDelete.taskId, confirmDelete.equipmentId)
    setConfirmDelete(null)
  }

  const openEquipmentModal = (task: TaskType) => {
    if (task.kind === 'CCTV') setEquipmentListModal(task)
    else setEquipmentSelectModal(task)
  }

  const emptyState = (
    <div
      className='rounded-2xl p-10 flex flex-col items-center justify-center'
      style={{ border: '2px dashed #66AEFF' }}
    >
      <TbBox size={44} className='text-(--default-blue) mb-3' />
      <p className='text-white/70 mb-3'>กรุณาเพิ่มอุปกรณ์ของแต่ละสายทาง ภายในโครงการนี้</p>
      <Button
        size='middle'
        shape='round'
        icon={<TbPlus />}
        onClick={() => setPointModal({ open: true, editingId: null })}
        style={{
          background: 'var(--yellow)', color: '#000',
          borderColor: 'var(--yellow)', fontWeight: 700,
        }}
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
        {route && route.points.length > 0 ? (
          <>
            <PointTabs onAddPoint={() => setPointModal({ open: true, editingId: null })} />
            <div className='mt-4'>
              {point ? (
                <TaskTypeTable
                  point={point}
                  onEditPoint={() => setPointModal({ open: true, editingId: point.id })}
                  onDeletePoint={handleDeletePoint}
                  onAddTaskType={() => setAddTaskTypeOpen(true)}
                  onDeleteTaskType={handleDeleteTaskType}
                  onOpenEquipment={openEquipmentModal}
                  onOpenCrossingCode={setCrossingCodeTask}
                />
              ) : (
                emptyState
              )}
            </div>
          </>
        ) : (
          emptyState
        )}
      </section>

      {!projectHasAnyEquipment && (
        <section
          className='mt-4 rounded-2xl p-6 text-center'
          style={{ border: '2px dashed #FF6666' }}
        >
          <TbAlertCircle size={40} className='text-(--red) mx-auto mb-2' />
          <p className='text-white/70 mb-1'>คุณสามารถลบโครงการนี้ได้ เนื่องจากไม่มีจุดติดตั้งในโครงการนี้</p>
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
        open={!!addEquipmentTaskId}
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
        onDelete={handleDeleteEquipment}
      />
      <EquipmentSelectModal
        open={!!equipmentSelectModal}
        task={equipmentSelectModal}
        projectName={project.name}
        onClose={() => setEquipmentSelectModal(null)}
        onOpenLiveStream={setLiveStreamEquipment}
      />
      <LiveStreamModal
        open={!!liveStreamEquipment}
        equipment={liveStreamEquipment}
        pointLabel={`${route?.code ?? ''} ${point?.name ?? ''}`}
        onClose={() => setLiveStreamEquipment(null)}
      />
      <CrossingCodeModal
        open={!!crossingCodeTask}
        task={crossingCodeTask}
        onClose={() => setCrossingCodeTask(null)}
      />

      <ConfirmDeleteModal
        open={confirmDelete?.kind === 'equipment'}
        title='ยืนยันลบอุปกรณ์หรือไม่?'
        subtitle='ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้'
        onCancel={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        bodyNode={
          <div className='text-sm text-black text-center py-2'>
            ยืนยันการลบอุปกรณ์นี้
          </div>
        }
      />
      <ConfirmDeleteModal
        open={confirmDelete?.kind === 'point'}
        title='ยืนยันลบจุดติดตั้งหรือไม่?'
        subtitle='ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้'
        onCancel={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        bodyNode={
          <div className='text-sm text-black text-center py-2'>
            <p className='font-bold mb-1'>จุดติดตั้ง : {point?.name}</p>
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
        bodyNode={<div className='text-sm text-black text-center py-2'>ยืนยันการลบประเภทงาน</div>}
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
          <div className='text-sm text-black text-center'>
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
                    className='inline-flex px-3 py-1 rounded-full text-xs'
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
          <div className='text-sm text-black'>
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
      <CannotDeleteModal
        open={cannotDelete?.kind === 'equipment'}
        title='ไม่สามารถลบอุปกรณ์ได้'
        subtitleNode={
          <>
            เนื่องจากระบบตรวจพบอุปกรณ์อยู่ใน{' '}
            <span className='text-red-500 font-semibold'>
              {(cannotDelete?.kind === 'equipment' && cannotDelete.usedIn.length) || 0} ประเภทงาน
            </span>
          </>
        }
        onClose={() => setCannotDelete(null)}
        bodyNode={
          <div className='text-sm text-black'>
            {cannotDelete?.kind === 'equipment' && (
              <>
                <p className='mb-2'>
                  ชื่อกล้อง : <span className='font-semibold'>{cannotDelete.equipmentName}</span>
                </p>
                <p className='mb-1'>ประเภทงานที่ยังใช้อุปกรณ์นี้:</p>
                <div className='flex gap-2 flex-wrap'>
                  {cannotDelete.usedIn.map((k, i) => (
                    <span
                      key={i}
                      className='inline-flex px-3 py-1 rounded-full text-xs'
                      style={{ background: '#F59E0B', color: '#000' }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
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
  const projectId = searchParams.get('id') ?? 'p-001'

  return (
    <ProjectDetailProvider projectId={projectId}>
      <DetailContent />
    </ProjectDetailProvider>
  )
}

export default React.memo(SettingProjectDetailScreen)
