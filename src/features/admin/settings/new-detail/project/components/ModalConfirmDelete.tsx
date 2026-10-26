import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetConfirmDeleteSolutionModalData } from '@/stores/reducers/modal/customModalSlice'
import { APIResponseCameraCrossingCode, SolutionLocation } from '@/types/manage/project-detail-api'
import { SolutionList } from '@/types/manage/project-detail-api'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { App, ConfigProvider, Modal } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { useDeleteCamera, useDeleteProjectSolution } from '@/hooks/queries/manage'
import { errText, useProjectContext } from '../context'
import { fmtNumber } from '@/utils/formatNumber'
import { APIResponseCCTVDetail } from '@/types/cctv/shared-api'
import { SOLUTION_BADGE_MAP } from '@/constants'

// Devices listed before the rest collapse behind "แสดงเพิ่มเติม".
const MAX_VISIBLE_DEVICES = 5

// Same check as CCTVModal's `deviceTypeBadges`: CCTV is the base type every
// camera has, so it never blocks a delete. The extra solution types are
// whichever SOLUTION_BADGE_MAP keys the camera-detail payload carries.
const getCctvBlockers = (cctv?: APIResponseCCTVDetail | null) =>
  SOLUTION_BADGE_MAP.filter((badge) => cctv?.[badge.key as keyof APIResponseCCTVDetail])

interface Props {
}

interface ContentProps {
  type?: 'DELETE_SOLUTION' | 'DELETE_SOLUTION_TYPE' | 'DELETE_CCTV'
  data?: SolutionList[] | null
  item?: SolutionLocation | null
  record?: SolutionList | null
  crossingIndexData?: APIResponseCameraCrossingCode | null
  cctvData?: APIResponseCCTVDetail | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { type, data, item, record, crossingIndexData, cctvData } = props
  // Modal uses destroyOnHidden, so this resets to collapsed on every open.
  const [showAllDevices, setShowAllDevices] = useState(false)

  const renderSolutionTag = useMemo(() => {
    if (!data?.length) return
    return data?.map((solution) => {
      // DEFAULT TEXT BASED ON ATLAS
      let solutionName = solution.solution_type.solution_name_atlas
      // IF ATLAS NOT AVAILABLE THEN USE NORMAL TEXT
      if (!solution.solution_type.solution_name_atlas) {
        solutionName = solution.solution_type.solution_name
      }
      return (
        <div key={solution.id} className='px-5 py-0.5 bg-(--default-red) rounded-4xl'>
          <p>{solutionName || '-'}</p>
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

  const renderNonDeleteSolutionType = useMemo(() => {
    let solutionTypeName = record?.solution_type?.solution_name_atlas
    if (!record?.solution_type?.solution_name_atlas) {
      solutionTypeName = record?.solution_type?.solution_name
    }

    const devices = crossingIndexData?.camera_crossing_index_code ?? []
    const hiddenCount = devices.length - MAX_VISIBLE_DEVICES
    const visibleDevices = showAllDevices ? devices : devices.slice(0, MAX_VISIBLE_DEVICES)

    const solutionList = visibleDevices.map((crIt) => {
      return (
        <li key={crIt.camera_id}>{crIt.camera_name || '-'}</li>
      )
    })

    let toggleItem: React.ReactNode = null
    if (hiddenCount > 0) {
      toggleItem = showAllDevices ? (
        <li key='toggle-devices'>
          <button type='button' className='underline cursor-pointer' onClick={() => setShowAllDevices(false)}>
            แสดงน้อยลง
          </button>
        </li>
      ) : (
        <li key='toggle-devices'>
          และอีก {fmtNumber(hiddenCount)} รายการ{' '}
          <button type='button' className='underline cursor-pointer' onClick={() => setShowAllDevices(true)}>
            แสดงเพิ่มเติม
          </button>
        </li>
      )
    }

    return (
      <div className='mt-5'>
        <section>
          <div className='flex flex-col items-center justify-center gap-5'>
            <ExclamationCircleOutlined style={{ fontSize: '7rem', color: 'var(--default-red)' }} />
            <div className='text-center'>
              <h2>ไม่สามารถลบประเภทงานได้</h2>
              <p>เนื่องจากระบบตรวจพบอุปกรณ์ <span className='text-(--default-red) font-bold'>{fmtNumber(Number(crossingIndexData?.camera_crossing_index_code?.length || 0))} อุปกรณ์</span></p>
            </div>
          </div>
        </section>
        <section className='mt-5'>
          <div className='rounded-lg border border-(--default-red) bg-(--default-red)/20 p-5'>
            <div className='text-center'>
              <h4>ประเภทงาน <span className='text-(--default-red) font-bold'>{solutionTypeName || '-'}</span> มีอุปกรณ์ที่ใช้งาน ดังนี้</h4>
              <ul className='list-disc! flex flex-col w-fit mx-auto pl-5 text-left'>
                {solutionList}
                {toggleItem}
              </ul>
            </div>
          </div>
        </section>
      </div>
    )

  }, [
    crossingIndexData?.camera_crossing_index_code,
    showAllDevices,
    record?.solution_type?.solution_name_atlas,
    record?.solution_type?.solution_name
  ])

  const renderWarningSolutionType = useMemo(() => {
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

  const renderDeleteSolutionTypeContent = useMemo(() => {
    if (crossingIndexData?.camera_crossing_index_code?.length) return renderNonDeleteSolutionType
    if (!crossingIndexData?.camera_crossing_index_code?.length) return renderWarningSolutionType
  }, [
    crossingIndexData?.camera_crossing_index_code?.length,
    renderNonDeleteSolutionType,
    renderWarningSolutionType
  ])

  const cctvBlockers = useMemo(() => getCctvBlockers(cctvData), [cctvData])

  const renderCCTVSolutionTag = useMemo(() => {
    if (!cctvBlockers.length) return
    return cctvBlockers.map((badge) => (
      <div key={badge.key} className='px-5 py-0.5 bg-(--default-red) rounded-4xl'>
        <p>{badge.label}</p>
      </div>
    ))
  }, [cctvBlockers])

  const renderNonDeleteCCTV = useMemo(() => {
    return (
      <div className='mt-5'>
        <section>
          <div className='flex flex-col items-center justify-center gap-5'>
            <ExclamationCircleOutlined style={{ fontSize: '7rem', color: 'var(--default-red)' }} />
            <div className='text-center'>
              <h2>ไม่สามารถลบ {cctvData?.camera_name || '-'} ได้</h2>
              <p>เนื่องจากระบบตรวจพบประเภทงาน <span className='text-(--default-red)'>{cctvBlockers.length} ประเภท</span></p>
            </div>
          </div>
        </section>
        <section className='mt-5'>
          <div className='rounded-lg border border-(--default-red) bg-(--default-red)/20 p-5'>
            <div className='text-center'>
              <p>กล้องนี้ไม่สามารถลบได้ เนื่องจากยังถูกใช้งานในประเภทงาน</p>
              <p>กรุณานำกล้องออกจาก <span className='font-semibold underline'>ประเภทงาน</span> ก่อน จึงจะสามารถลบกล้องได้</p>
            </div>
            <div className='flex flex-wrap justify-center items-center gap-2 mt-3'>
              {renderCCTVSolutionTag}
            </div>
          </div>
        </section>
      </div>
    )
  }, [cctvData?.camera_name, cctvBlockers.length, renderCCTVSolutionTag])

  const renderWarningCCTV = useMemo(() => {
    return (
      <div className='mt-5'>
        <section>
          <div className='flex flex-col items-center justify-center gap-5'>
            <ExclamationCircleOutlined style={{ fontSize: '7rem', color: 'var(--default-orange)' }} />
            <div className='text-center'>
              <h2>ยืนยันลบกล้องหรือไม่?</h2>
              <p>ระบบจะลบกล้องโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
            </div>
          </div>
        </section>
        <section className='mt-5'>
          <div className='rounded-lg border border-(--default-orange) bg-(--default-orange)/20 p-5'>
            <div className='text-center'>
              <h4>กล้อง : {cctvData?.camera_name || '-'}</h4>
              <p>ไม่มีประเภทงานที่ใช้งานกล้องนี้อยู่</p>
              <p>สามารถลบกล้องออกจากระบบได้อย่างปลอดภัย</p>
            </div>
          </div>
        </section>
      </div>
    )
  }, [cctvData?.camera_name])

  const renderDeleteCCTVContent = useMemo(() => {
    if (cctvBlockers.length) return renderNonDeleteCCTV
    if (!cctvBlockers.length) return renderWarningCCTV
  }, [cctvBlockers.length, renderNonDeleteCCTV, renderWarningCCTV])

  const renderContent = useMemo(() => {
    switch (type) {
      case 'DELETE_SOLUTION':
        return renderDeleteSolutionContent
      case 'DELETE_SOLUTION_TYPE':
        return renderDeleteSolutionTypeContent
      case 'DELETE_CCTV':
        return renderDeleteCCTVContent
      default:
        return null
    }
  }, [type, renderDeleteSolutionContent, renderDeleteSolutionTypeContent, renderDeleteCCTVContent])


  return renderContent
}

const ModalConfirmDelete: React.FC<Props> = (props) => {
  const { } = props
  const { open, data, item, type, record, crossing_index_data, cctv_data } = useAppSelector((state) => state.custom_modal.confirm_delete_solution_modal)
  const { onDelete, isDeleting } = useProjectContext()
  const { message } = App.useApp()
  const { mutate: deleteSolution, isPending: isDeletingSolution } = useDeleteProjectSolution()
  const { mutate: deleteCamera, isPending: isDeletingCamera } = useDeleteCamera()
  const dispatch = useAppDispatch()
  const isBusy = isDeleting || isDeletingSolution || isDeletingCamera
  // Each type is blocked by something different still hanging off the target:
  //   DELETE_SOLUTION       → solutions at the point (`data`)
  //   DELETE_SOLUTION_TYPE  → devices attached to the solution (`crossing_index_data`)
  //   DELETE_CCTV           → solution types the camera still serves (`cctv_data`)
  const blockerCount = type === 'DELETE_SOLUTION_TYPE'
    ? crossing_index_data?.camera_crossing_index_code?.length
    : type === 'DELETE_CCTV'
      ? getCctvBlockers(cctv_data).length
      : data?.length
  const canDelete = !blockerCount

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
      case 'DELETE_CCTV':
        // One camera: the hook refetches the road's camera list.
        if (!cctv_data?.id) return
        deleteCamera(cctv_data.id, {
          onSuccess: () => {
            message.success('ลบกล้องสำเร็จ')
            handleClose()
          },
          onError: (error) => {
            message.error(errText(error, 'ลบกล้องไม่สำเร็จ'))
          },
        })
        return
      default:
        return
    }
  }, [type, item, record, cctv_data, onDelete, deleteSolution, deleteCamera, handleClose, message])

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
          crossingIndexData={crossing_index_data}
          cctvData={cctv_data}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalConfirmDelete)
