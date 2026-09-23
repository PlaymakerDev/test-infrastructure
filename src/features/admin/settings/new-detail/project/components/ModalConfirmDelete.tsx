import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetConfirmDeleteSolutionModalData } from '@/stores/reducers/modal/customModalSlice'
import { SolutionLocation } from '@/types/manage/project-detail-api'
import { SolutionList } from '@/types/manage/project-detail-api'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { App, ConfigProvider, Modal } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { useDeleteProjectSolution } from '@/hooks/queries/manage'
import { errText, useProjectContext } from '../context'

interface Props {
}

interface ContentProps {
  type?: 'DELETE_SOLUTION' | 'DELETE_SOLUTION_TYPE'
  data?: SolutionList[] | null
  item?: SolutionLocation | null
  record?: SolutionList | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { type, data, item, record } = props

  const renderSolutionTag = useMemo(() => {
    if (!data?.length) return
    return data?.map((solution) => {
      return (
        <div key={solution.id} className='px-5 py-0.5 bg-(--default-red) rounded-4xl'>
          <p>{solution.solution_type.solution_name_atlas || '-'}</p>
        </div>
      )
    })
  }, [data])

  const renderNonDeleteContent = useMemo(() => {
    return (
      <div className='mt-5'>
        <section>
          <div className='flex flex-col items-center justify-center gap-5'>
            <ExclamationCircleOutlined style={{ fontSize: '7rem', color: 'var(--default-red)' }} />
            <div className='text-center'>
              <h2>ไม่สามารถลบ{item?.location_name || '-'} ได้</h2>
              <p>เนื่องจากระบบตรวจพบประเภทงาน <span className='text-(--default-red)'>{data?.length || 0} ประเภท</span></p>
            </div>
          </div>
        </section>
        <section className='mt-5'>
          <div className='rounded-lg border border-(--default-red) bg-(--default-red)/20 p-5'>
            <div className='text-center'>
              <p>จุดติดตั้งนี้ไม่สามารถลบได้ เนื่องจากยังมีข้อมูลประเภทงาน</p>
              <p>กรุณาลบ <span className='font-semibold underline'>ประเภทงาน</span> ก่อน จึงจะสามารถลบจุดติดตั้งได้</p>
            </div>
            <div className='flex flex-wrap justify-center items-center gap-2 mt-3'>
              {renderSolutionTag}
            </div>
          </div>
        </section>
      </div>
    )
  }, [data, renderSolutionTag, item?.location_name])

  const renderWarningContent = useMemo(() => {
    return (
      <div className='mt-5'>
        <section>
          <div className='flex flex-col items-center justify-center gap-5'>
            <ExclamationCircleOutlined style={{ fontSize: '7rem', color: 'var(--default-orange)' }} />
            <div className='text-center'>
              <h2>ยืนยันลบจุดติดตั้งหรือไม่?</h2>
              <p>ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
            </div>
          </div>
        </section>
        <section className='mt-5'>
          <div className='rounded-lg border border-(--default-orange) bg-(--default-orange)/20 p-5'>
            <div className='text-center'>
              <h4>จุดติดตั้ง : {item?.location_name || '-'}</h4>
              <p>ไม่มีประเภทงานหรืออุปกรณ์ที่ใช้งานอยู่ในจุดติดตั้งนี้</p>
              <p>สามารถลบจุดติดตั้งออกจากระบบได้อย่างปลอดภัย</p>
            </div>
          </div>
        </section>
      </div>
    )
  }, [item?.location_name])

  const renderDeleteSolutionContent = useMemo(() => {
    if (data?.length) return renderNonDeleteContent
    if (!data?.length) return renderWarningContent
  }, [data, renderNonDeleteContent, renderWarningContent])

  const renderDeleteSolutionTypeContent = useMemo(() => {
    return (
      <div className='mt-5'>
        <section>
          <div className='flex flex-col items-center justify-center gap-5'>
            <ExclamationCircleOutlined style={{ fontSize: '7rem', color: 'var(--default-orange)' }} />
            <div className='text-center'>
              <h2>ยืนยันลบประเภทงานหรือไม่?</h2>
              <p>ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
            </div>
          </div>
        </section>
        <section className='mt-5'>
          <div className='rounded-lg border border-(--default-orange) bg-(--default-orange)/20 p-5'>
            <div className='text-center'>
              <h4>ประเภทงาน : {record?.solution_name || '-'}</h4>
              <p>ไม่มีอุปกรณ์ที่ใช้งานอยู่ในประเภทงานนี้</p>
              <p>สามารถลบประเภทงานออกจากระบบได้อย่างปลอดภัย</p>
            </div>
          </div>
        </section>
      </div>
    )
  }, [record?.solution_name])

  const renderContent = useMemo(() => {
    switch (type) {
      case 'DELETE_SOLUTION':
        return renderDeleteSolutionContent
      case 'DELETE_SOLUTION_TYPE':
        return renderDeleteSolutionTypeContent
      default:
        return null
    }
  }, [type, renderDeleteSolutionContent, renderDeleteSolutionTypeContent])


  return renderContent
}

const ModalConfirmDelete: React.FC<Props> = (props) => {
  const { } = props
  const { open, data, item, type, record } = useAppSelector((state) => state.custom_modal.confirm_delete_solution_modal)
  const { onDelete, isDeleting } = useProjectContext()
  const { message } = App.useApp()
  const { mutate: deleteSolution, isPending: isDeletingSolution } = useDeleteProjectSolution()
  const dispatch = useAppDispatch()
  const isBusy = isDeleting || isDeletingSolution
  // DELETE_SOLUTION is blocked while the point still holds solutions (`data`);
  // DELETE_SOLUTION_TYPE deletes one row and has no such precondition.
  const canDelete = type === 'DELETE_SOLUTION_TYPE' || !data?.length

  const handleClose = useCallback(() => {
    dispatch(resetConfirmDeleteSolutionModalData())
  }, [dispatch])

  // Both branches close the modal only once the delete succeeded AND the
  // dependent data has refreshed; on error the modal stays open (the reason
  // is toasted) so the user can retry or cancel against the same target.
  const handleConfirm = useCallback(() => {
    switch (type) {
      case 'DELETE_SOLUTION':
        // The point: the context refetches the tabs list and picks the
        // fallback tab, and toasts both outcomes itself.
        if (!item?.solution_location_id) return
        onDelete(item.solution_location_id, { onSuccess: handleClose })
        return
      case 'DELETE_SOLUTION_TYPE':
        // One solution row: the hook refetches the point's solution list.
        if (!record?.id) return
        deleteSolution(record.id, {
          onSuccess: () => {
            message.success('ลบประเภทงานสำเร็จ')
            handleClose()
          },
          onError: (error) => {
            message.error(errText(error, 'ลบประเภทงานไม่สำเร็จ'))
          },
        })
        return
      default:
        return
    }
  }, [type, item, record, onDelete, deleteSolution, handleClose, message])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
            borderRadiusLG: 20,
          }
        }
      }}
    >
      <Modal
        title={null}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        okText={canDelete ? 'ยืนยัน' : 'รับทราบ'}
        cancelText={'ยกเลิก'}
        okButtonProps={{
          shape: 'round',
          loading: isBusy,
        }}
        cancelButtonProps={{
          shape: 'round',
          disabled: isBusy,
          className: canDelete ? '' : 'hidden!'
        }}
        onOk={() => canDelete ? handleConfirm() : handleClose()}
        onCancel={handleClose}
        destroyOnHidden
        width={600}
      >
        <Content
          type={type}
          data={data}
          item={item}
          record={record}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalConfirmDelete)
