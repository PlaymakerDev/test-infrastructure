import { ConfigProvider, Empty, Modal, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { INIT_OPEN_CONFIRM_CREATE, useControlVMSContext } from '../../../context'
import { ContentConfirmCreate } from '../../../components'
import { useVMSSettingByVMSID } from '../../../hooks/useVMSSettingByVMSID'

interface Props {

}

const ModalConfirmCreate: React.FC<Props> = (props) => {
  const { } = props
  const { openConfirmCreate, setOpenConfirmCreate } = useControlVMSContext()
  const { open, ids, body, id } = openConfirmCreate

  const { data, isLoading, isError } = useVMSSettingByVMSID(ids, open)

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />

    return <ContentConfirmCreate data={data?.data} body={body ?? undefined} id={id ?? undefined} />
  }, [isLoading, isError, data, body, id])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#000000',
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
          },
        }
      }}
    >
      <Modal
        title={false}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => setOpenConfirmCreate(INIT_OPEN_CONFIRM_CREATE)}
        onCancel={() => setOpenConfirmCreate(INIT_OPEN_CONFIRM_CREATE)}
        footer={null}
        destroyOnHidden
        width={700}
      >
        {renderContent}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalConfirmCreate)
