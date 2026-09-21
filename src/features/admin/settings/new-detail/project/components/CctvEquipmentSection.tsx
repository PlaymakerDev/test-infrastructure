"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { App, Button, ConfigProvider } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { TbVideo } from 'react-icons/tb'
import { getProjectRoadCamerasAPI } from '@/services/routes/ProjectDetailService'
import { manageKeys, useDeleteCamera } from '@/hooks/queries/manage'
import { ProjectRoadCamera } from '@/types/manage/project-detail-api'
import { useProjectContext, errText } from '../context'
import ModalCreateCamera from './ModalCreateCamera'
import TableRoadCameras from './TableRoadCameras'

interface Props { }

/**
 * The สายทาง-level "อุปกรณ์ CCTV" panel.
 *
 * CCTV is one solution per (โครงการ + สายทาง), so it does not belong inside a
 * จุดติดตั้ง tab the way the other ประเภทงาน do — it sits above them and
 * lists every camera on the road, each row naming the point it stands at.
 */
const CctvEquipmentSection: React.FC<Props> = () => {
  const { roadSolution, activeLocationId } = useProjectContext()
  const { message } = App.useApp()
  const projectRoadId = roadSolution.project_road_id

  const [editing, setEditing] = useState<ProjectRoadCamera | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: manageKeys.solutions.camerasAtProjectRoad(projectRoadId),
    queryFn: () => getProjectRoadCamerasAPI(projectRoadId).then((res) => res.data),
    enabled: projectRoadId > 0,
  })

  const { mutate: deleteCamera, isPending: isDeleting } = useDeleteCamera()

  const cameras = useMemo(() => data?.cameras ?? [], [data])

  const openCreate = useCallback(() => {
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((camera: ProjectRoadCamera) => {
    setEditing(camera)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditing(null)
  }, [])

  const handleDelete = useCallback((camera: ProjectRoadCamera) => {
    deleteCamera(camera.id, {
      onSuccess: () => message.success('ลบกล้องสำเร็จ'),
      onError: (err) => message.error(errText(err, 'ลบกล้องไม่สำเร็จ')),
    })
  }, [deleteCamera, message])

  const locations = roadSolution.solution_locations

  // Defensive: MainContent already shows its empty state before rendering
  // this, so a road with no จุดติดตั้ง never gets here. (The camera form's
  // dropdown can create one, but only once there is a panel to open it
  // from.)
  if (!locations.length) return null

  return (
    <div
      className='bg-(--dark-black) py-4 px-8 rounded-lg mb-6'
      style={{ boxShadow: '0px 8px 10px 0px #00000040' }}
    >
      <div className='flex items-center justify-between flex-wrap gap-3 mb-4'>
        <div className='flex items-center gap-3'>
          <TbVideo className='fs-24 text-(--yellow)' />
          <h4 className='text-(--yellow)'>อุปกรณ์ CCTV</h4>
          {data?.solution?.solution_name && (
            <span className='fs-12 text-(--light-gray-1)'>{data.solution.solution_name}</span>
          )}
          <span className='rounded-2xl px-3 border border-white fs-12'>
            {cameras.length} กล้อง
          </span>
        </div>
        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          <Button
            ghost
            type='primary'
            htmlType='button'
            shape='round'
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            เพิ่มกล้อง
          </Button>
        </ConfigProvider>
      </div>

      <TableRoadCameras
        data={cameras}
        isLoading={isLoading}
        isError={isError}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <ModalCreateCamera
        open={isModalOpen}
        camera={editing}
        locations={locations}
        defaultLocationId={activeLocationId ? Number(activeLocationId) : null}
        onClose={closeModal}
      />
    </div>
  )
}

export default React.memo<Props>(CctvEquipmentSection)
