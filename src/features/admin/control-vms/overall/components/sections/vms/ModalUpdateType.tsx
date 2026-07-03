import { Empty, Modal, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { INIT_OPEN_UPDATE_TYPE, useControlVMSContext } from '../../../context'
import { FormUpdateType } from '../..'
import { useVMSSettingTypes } from '../../../hooks/useVMSSettingTypes'

interface Props {

}

const ModalUpdateType: React.FC<Props> = (props) => {
  const { } = props
  const { openUpdateType, setOpenUpdateType } = useControlVMSContext()
  const { data, isLoading, isError } = useVMSSettingTypes()

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <FormUpdateType data={data?.data ?? []} />
  }, [data, isLoading, isError])

  return (
    <Modal
      title="จัดการประเภท"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={openUpdateType.open}
      onOk={() => setOpenUpdateType(INIT_OPEN_UPDATE_TYPE)}
      onCancel={() => setOpenUpdateType(INIT_OPEN_UPDATE_TYPE)}
      footer={null}
      destroyOnHidden
      width={700}
    >
      {renderContent}
    </Modal>
  )
}

export default React.memo<Props>(ModalUpdateType)
