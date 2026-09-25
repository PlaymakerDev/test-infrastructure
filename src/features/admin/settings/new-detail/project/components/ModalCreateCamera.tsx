import React, { useCallback, useMemo, useRef } from 'react'
import { ConfigProvider, Modal } from 'antd'
import { TbVideo } from 'react-icons/tb'
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

  const handleOk = useCallback(() => submitRef.current?.click(), [])

  const title = useMemo(() => (
    <div className='flex items-center flex-wrap gap-3'>
      <TbVideo className='fs-24 text-(--default-blue)' />
      <h3 className='text-(--default-blue)'>
        {camera ? 'แก้ไขกล้อง CCTV' : 'เพิ่มกล้อง CCTV'}
      </h3>
    </div>
  ), [camera])

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
        okButtonProps={{ shape: 'round' }}
        cancelButtonProps={{ shape: 'round' }}
        destroyOnHidden
        width={800}
      >
        <FormCreateCamera
          data={camera}
          locations={locations}
          defaultLocationId={defaultLocationId}
          submitRef={submitRef}
          onSuccess={onClose}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCreateCamera)
