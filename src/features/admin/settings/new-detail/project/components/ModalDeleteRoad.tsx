"use client"
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { App, ConfigProvider, Modal } from 'antd'
import React, { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteProjectRoad } from '@/hooks/queries/manage'
import type { RoadSolutionList } from '@/types/manage/project-detail-api'
import { errText, useProjectContext } from '../context'
import { roadLabel } from '../data/projectRoads'

interface Props {
  open: boolean
  road: RoadSolutionList | null
  onClose: () => void
  /** After the road is gone and before the modal closes — TitleSection moves
   *  to another tab. */
  onDeleted?: (road: RoadSolutionList) => Promise<void> | void
}

/** ลบสายทาง — the road tab currently selected. Same two faces as the page's
 *  จุดติดตั้ง delete (ModalConfirmDelete): blocked while the road still has
 *  install points — the backend refuses those with a foreign-key error
 *  (res_code 40098) — otherwise a confirm. */
const ModalDeleteRoad: React.FC<Props> = (props) => {
  const { open, road, onClose, onDeleted } = props
  const { id } = useProjectContext()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const { mutate: deleteProjectRoad, isPending } = useDeleteProjectRoad()

  const locations = road?.solution_locations ?? []
  const canDelete = locations.length === 0
  const label = roadLabel(road?.road)

  const handleConfirm = useCallback(() => {
    if (!road) return
    deleteProjectRoad(road.project_road_id, {
      onSuccess: async () => {
        message.success('ลบสายทางสำเร็จ')
        // Hand-written keys (TitleSection/EmptyRoadSolution) that the hook's
        // own invalidation doesn't reach.
        queryClient.invalidateQueries({ queryKey: ['project', id] })
        queryClient.invalidateQueries({ queryKey: ['roadSolution', id] })
        await onDeleted?.(road)
        onClose()
      },
      onError: (error) => {
        const code = (error as { response?: { data?: { res_code?: number } } })?.response?.data?.res_code
        message.error(code === 40098
          ? 'ลบสายทางไม่ได้ เนื่องจากยังมีจุดติดตั้งในสายทางนี้'
          : errText(error, 'ลบสายทางไม่สำเร็จ'))
      },
    })
  }, [road, deleteProjectRoad, message, queryClient, id, onDeleted, onClose])

  const renderBlocked = () => (
    <div className='mt-5'>
      <section>
        <div className='flex flex-col items-center justify-center gap-5'>
          <ExclamationCircleOutlined style={{ fontSize: '7rem', color: 'var(--default-red)' }} />
          <div className='text-center'>
            <h2>ไม่สามารถลบสายทาง {label} ได้</h2>
            <p>เนื่องจากระบบตรวจพบจุดติดตั้ง <span className='text-(--default-red)'>{locations.length} จุด</span></p>
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <div className='rounded-lg border border-(--default-red) bg-(--default-red)/20 p-5'>
          <div className='text-center'>
            <p>สายทางนี้ไม่สามารถลบได้ เนื่องจากยังมีจุดติดตั้ง</p>
            <p>กรุณาลบ <span className='font-semibold underline'>จุดติดตั้ง</span> ก่อน จึงจะสามารถลบสายทางได้</p>
          </div>
          <div className='flex flex-wrap justify-center items-center gap-2 mt-3'>
            {locations.map((location) => (
              <div key={location.solution_location_id} className='px-5 py-0.5 bg-(--default-red) rounded-4xl'>
                <p>{location.location_name || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )

  const renderConfirm = () => (
    <div className='mt-5'>
      <section>
        <div className='flex flex-col items-center justify-center gap-5'>
          <ExclamationCircleOutlined style={{ fontSize: '7rem', color: 'var(--default-orange)' }} />
          <div className='text-center'>
            <h2>ยืนยันลบสายทางหรือไม่?</h2>
            <p>ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <div className='rounded-lg border border-(--default-orange) bg-(--default-orange)/20 p-5'>
          <div className='text-center'>
            <h4>สายทาง : {label}</h4>
            <p>ไม่มีจุดติดตั้งในสายทางนี้</p>
            <p>สามารถลบสายทางออกจากโครงการได้อย่างปลอดภัย</p>
          </div>
        </div>
      </section>
    </div>
  )

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
            borderRadiusLG: 20,
          },
        },
      }}
    >
      <Modal
        title={null}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        okText={canDelete ? 'ยืนยัน' : 'รับทราบ'}
        cancelText='ยกเลิก'
        okButtonProps={{
          shape: 'round',
          loading: isPending,
        }}
        cancelButtonProps={{
          shape: 'round',
          disabled: isPending,
          className: canDelete ? '' : 'hidden!',
        }}
        onOk={() => (canDelete ? handleConfirm() : onClose())}
        onCancel={onClose}
        destroyOnHidden
        width={600}
      >
        {canDelete ? renderConfirm() : renderBlocked()}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalDeleteRoad)
