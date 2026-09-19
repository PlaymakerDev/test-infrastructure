import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import { FormCreateDevice } from '../components'

interface Props {

}

interface ContentProps { }

const Content: React.FC<ContentProps> = (props) => {
  const { } = props
  return (
    <FormCreateDevice />
  )
}

const ModalViewCCTV: React.FC<Props> = (props) => {
  const { } = props

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
        title="Basic Modal"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={false}
        onOk={() => console.log("OK")}
        onCancel={() => console.log("Cancel")}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          shape: 'round'
        }}
        cancelButtonProps={{
          shape: 'round'
        }}
        destroyOnHidden
      >
        <Content />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalViewCCTV)
