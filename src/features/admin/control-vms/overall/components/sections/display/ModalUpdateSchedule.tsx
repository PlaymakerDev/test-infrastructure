import { ConfigProvider, Empty, Modal, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { INIT_UPDATE_SCHEDULE, useControlVMSContext } from '../../../context'
import { TbCopyPlus } from 'react-icons/tb'
import { useVMSMediaById } from '../../../hooks/useVMSMediaById'
import { ContentBatchDelete, ContentDeleteSchedule, FormUpdateSchedule } from '../../../components'

interface Props {

}

const ModalUpdateSchedule: React.FC<Props> = (props) => {
  const { } = props
  const { updateScheduleState, setUpdateScheduleState } = useControlVMSContext()
  const { open, id, type, vmsOption } = updateScheduleState
  const isDeleteType = type === 'DELETE' || type === 'BATCH_DELETE'

  const { data, isLoading, isError } = useVMSMediaById(
    id,
    !!id && (type === 'EDIT' || isDeleteType),
  )

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />

    if (type === 'CREATE' || type === 'EDIT') return <FormUpdateSchedule id={id!} type={type} data={data?.data} vmsOption={vmsOption} />
    if (type === 'DELETE') return <ContentDeleteSchedule id={id!} data={data?.data} vmsOption={vmsOption} />
    if (type === 'BATCH_DELETE') return <ContentBatchDelete id={id!} data={data?.data} vmsOption={vmsOption} />
    return <Empty description="ไม่พบข้อมูล" />
  }, [isLoading, isError, data, id, type, vmsOption])


  const renderTitle = useMemo(() => {
    let title: string = 'เพิ่มรูปแบบการแสดงผล'
    if (type === 'EDIT') title = 'แก้ไขรูปแบบการแสดงผล'

    if (isDeleteType) return

    return (
      <div className='flex items-start gap-2 mb-5'>
        <TbCopyPlus className='fs-22 text-(--yellow) shrink-0' />
        <div>
          <h4 className='mb-0 text-(--yellow)'>{title}</h4>
          <p className='fs-12 text-gray-400 mb-0'>เพิ่มรูปภาพ วิดีโอ และข้อความ</p>
        </div>
      </div>
    )
  }, [type, isDeleteType])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: isDeleteType ? '#000000' : '#FFFFFF',
            contentBg: isDeleteType ? '#FFFFFF' : 'var(--dark-black)',
            headerBg: isDeleteType ? '#FFFFFF' : 'var(--dark-black)',
            footerBg: isDeleteType ? '#FFFFFF' : 'var(--dark-black)',
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
        width={isDeleteType ? 700 : 1000}
      >
        {renderContent}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalUpdateSchedule)
