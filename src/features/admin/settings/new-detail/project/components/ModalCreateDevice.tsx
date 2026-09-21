import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetCreateDeviceModalData } from '@/stores/reducers/modal/customModalSlice'
import { SolutionList, SolutionLocation } from '@/types/manage/project-detail-api'
import { ConfigProvider, Modal } from 'antd'
import React, { RefObject, useCallback, useMemo, useRef } from 'react'
import { APIResponseSolutionByID } from '@/types/manage/project-detail-api'
import { FormUpdateSolutionLocation, FormCreateDevice, FormCreateCamera } from '../components'
import { useProjectContext } from '../context'
import { TbDeviceCctv, TbTools } from 'react-icons/tb'

interface Props {

}

interface ContentProps {
  data?: APIResponseSolutionByID | null
  item?: SolutionLocation | null
  record?: SolutionList | null
  type?: 'CREATE' | 'UPDATE' | 'EDIT_SOLUTION_NAME' | 'CREATE_CAMERA'
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

const Content: React.FC<ContentProps> = (props) => {
  const { item, data, type, submitRef, onSuccess } = props
  const { roadSolution } = useProjectContext()

  const renderContentType = useMemo(() => {
    switch (type) {
      case 'CREATE':
        return <FormCreateDevice item={item} submitRef={submitRef} onSuccess={onSuccess} />
      case 'UPDATE':
        return <FormCreateDevice data={data} item={item} submitRef={submitRef} onSuccess={onSuccess} />
      case 'EDIT_SOLUTION_NAME':
        return <FormUpdateSolutionLocation item={item} type={type} submitRef={submitRef} onSuccess={onSuccess} />
      case 'CREATE_CAMERA':
        // A camera belongs to a จุดติดตั้ง, not to a CCTV solution row — one
        // CCTV solution now covers the whole สายทาง. So the form takes the
        // road's points and preselects the one this modal was opened from,
        // rather than the `record` (solution) it used to receive.
        return (
          <FormCreateCamera
            locations={roadSolution.solution_locations}
            defaultLocationId={item?.solution_location_id ?? null}
            submitRef={submitRef}
            onSuccess={onSuccess}
          />
        )
      default:
        return null
    }
  }, [type, item, submitRef, onSuccess, data, roadSolution.solution_locations])

  return renderContentType
}

const ModalCreateDevice: React.FC<Props> = (props) => {
  const { } = props
  const { open, data, item, record, type } = useAppSelector(state => state.custom_modal.create_device_modal)
  const dispatch = useAppDispatch()
  const submitRef = useRef<HTMLButtonElement | null>(null)

  const handleClose = useCallback(() => {
    dispatch(resetCreateDeviceModalData())
  }, [dispatch])

  const renderTitle = useMemo(() => {
    switch (type) {
      case 'CREATE':
        return (
          <div className='flex items-center flex-wrap gap-3'>
            <TbTools className='fs-24 text-(--default-blue)' />
            <h3 className='text-(--default-blue)'>
              {'เพิ่มประเภทงาน'}
            </h3>
          </div>
        )
      case 'UPDATE':
        return (
          <div className='flex items-center flex-wrap gap-3'>
            <TbTools className='fs-24 text-(--default-blue)' />
            <h3 className='text-(--default-blue)'>
              {'แก้ไขประเภทงาน'}
            </h3>
          </div>
        )
      case 'EDIT_SOLUTION_NAME':
        return 'แก้ไขชื่อจุดติดตั้ง'
      case 'CREATE_CAMERA':
        return (
          <div className='flex items-center flex-wrap gap-3'>
            <TbDeviceCctv className='fs-24 text-(--default-blue)' />
            <h3 className='text-(--default-blue)'>
              {'เพิ่มข้อมูลอุปกรณ์'}
            </h3>
          </div>
        )
      default:
        return ''
    }
  }, [type])

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
        title={renderTitle}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => submitRef.current?.click()}
        onCancel={handleClose}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          shape: 'round'
        }}
        cancelButtonProps={{
          shape: 'round'
        }}
        destroyOnHidden
        width={type === 'EDIT_SOLUTION_NAME' ? 600 : 800}
      >
        <Content
          item={item}
          record={record}
          type={type}
          submitRef={submitRef}
          onSuccess={handleClose}
          data={data}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCreateDevice)
