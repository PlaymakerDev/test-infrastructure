import { ConfigProvider, Empty, Modal, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { INIT_UPDATE_SCHEDULE, useControlVMSContext } from '../../../context'
import FormUpdateSchedule from './FormUpdateSchedule'
import { TbCopyPlus } from 'react-icons/tb'
import { useVMSMediaById } from '../../../hooks/useVMSMediaById'
import ContentDeleteSchedule from './ContentDeleteSchedule'

interface Props {

}

const ModalUpdateSchedule: React.FC<Props> = (props) => {
  const { } = props
  const { updateScheduleState, setUpdateScheduleState } = useControlVMSContext()
  const { open, id, type, vmsOption } = updateScheduleState

  const { data, isLoading, isError } = useVMSMediaById(
    id,
    (!!id && type === 'EDIT') || (!!id && type === 'DELETE'),
  )

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />

    if (type === 'CREATE' || type === 'EDIT') return <FormUpdateSchedule id={id!} type={type} data={data?.data} vmsOption={vmsOption} />
    if (type === 'DELETE') return <ContentDeleteSchedule id={id!} data={data?.data} vmsOption={vmsOption} />
    return <Empty description="ไม่พบข้อมูล" />
  }, [isLoading, isError, data, id, type, vmsOption])


  const renderTitle = useMemo(() => {
    let title: string = 'เพิ่มรูปแบบการแสดงผล'
    if (type === 'EDIT') title = 'แก้ไขรูปแบบการแสดงผล'

    if (type === 'DELETE') return

    return (
      <div className='flex items-start gap-2 mb-5'>
        <TbCopyPlus className='fs-22 text-(--yellow) shrink-0' />
        <div>
          <h4 className='mb-0 text-(--yellow)'>{title}</h4>
          <p className='fs-12 text-gray-400 mb-0'>เพิ่มรูปภาพ วิดีโอ และข้อความ</p>
        </div>
      </div>
    )
  }, [type])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: type === 'DELETE' ? '#000000' : '#FFFFFF',
            contentBg: type === 'DELETE' ? '#FFFFFF' : 'var(--dark-black)',
            headerBg: type === 'DELETE' ? '#FFFFFF' : 'var(--dark-black)',
            footerBg: type === 'DELETE' ? '#FFFFFF' : 'var(--dark-black)',
          },
        }
      }}
    >
      <Modal
        title={renderTitle}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => setUpdateScheduleState(INIT_UPDATE_SCHEDULE)}
        onCancel={() => setUpdateScheduleState(INIT_UPDATE_SCHEDULE)}
        footer={null}
        destroyOnHidden
        width={type === 'DELETE' ? 700 : 1000}
      >
        {renderContent}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalUpdateSchedule)
