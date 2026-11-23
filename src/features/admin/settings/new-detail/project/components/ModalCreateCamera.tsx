import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Alert, Button, ConfigProvider, Modal, Skeleton } from 'antd'
import { TbVideo } from 'react-icons/tb'
import { useCCTVDetail } from '@/hooks/queries/shared/useCCTVDetail'
import { ProjectRoadCamera, SolutionLocation } from '@/types/manage/project-detail-api'
import FormCreateCamera from './FormCreateCamera'

interface Props {
  open: boolean
  /** null → create a new camera. */
  camera: ProjectRoadCamera | null
  locations: SolutionLocation[]
  /** Point to preselect on create — the จุดติดตั้ง tab the user is looking at. */
  defaultLocationId?: number | null
  onClose: () => void
}

/**
 * Host for the add/edit camera form.
 *
 * State lives in CctvEquipmentSection rather than the Redux modal slice: this
 * modal is mounted exactly once, by the component that owns the data, so the
 * indirection the shared slice exists for (several parent trees opening the
 * same modal) does not apply here.
 */
const ModalCreateCamera: React.FC<Props> = (props) => {
  const { open, camera, locations, defaultLocationId, onClose } = props
  const submitRef = useRef<HTMLButtonElement | null>(null)

  // Editing reads the camera's own record first. The road's camera list
  // doesn't carry access_url (Public URL), and PUT replaces the whole camera,
  // so a form that never had the value would clear it on any save.
  const detail = useCCTVDetail(camera?.id)

  // The form seeds from the first FRESH read and then keeps its fields: a
  // later refetch (network reconnect, the invalidation after saving) must not
  // remount it under the user's typing. Reset on close, so reopening right
  // after a save waits for the new value instead of seeding the old copy.
  const [seededId, setSeededId] = useState<string | null>(null)
  if (!camera && seededId !== null) setSeededId(null)
  if (camera && seededId !== camera.id && detail.data !== undefined && !detail.isFetching) {
    setSeededId(camera.id)
  }
  const isFormReady = !camera || seededId === camera.id

  const handleOk = useCallback(() => submitRef.current?.click(), [])

  const title = useMemo(() => (
    <div className='flex items-center flex-wrap gap-3'>
      <TbVideo className='fs-24 text-(--default-blue)' />
      <h3 className='text-(--default-blue)'>
        {camera ? 'แก้ไขกล้อง CCTV' : 'เพิ่มกล้อง CCTV'}
      </h3>
    </div>
  ), [camera])

  const renderBody = () => {
    if (isFormReady) {
      return (
        <FormCreateCamera
          data={camera}
          accessUrl={detail.data?.access_url}
          locations={locations}
          defaultLocationId={defaultLocationId}
          submitRef={submitRef}
          onSuccess={onClose}
        />
      )
    }
    if (detail.isError && !detail.isFetching) {
      return (
        <Alert
          type='error'
          showIcon
          title='โหลดข้อมูลกล้องไม่สำเร็จ'
          action={<Button size='small' onClick={() => void detail.refetch()}>ลองใหม่</Button>}
        />
      )
    }
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

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
        title={title}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={handleOk}
        onCancel={onClose}
        okText='ยืนยัน'
        cancelText='ยกเลิก'
        okButtonProps={{ shape: 'round', disabled: !isFormReady }}
        cancelButtonProps={{ shape: 'round' }}
        destroyOnHidden
        width={800}
      >
        {renderBody()}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCreateCamera)
