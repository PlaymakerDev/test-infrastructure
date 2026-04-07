import { Modal } from "antd";
import { AxiosError } from "axios";

export const useTimeoutModal = () => {
  const [modal, contextHolder] = Modal.useModal()

  const showTimeoutModal = (
    error: AxiosError,
    onOkFunc: () => void,
    onCancelFunc: () => void
  ) => {
    modal.confirm({
      title: 'Session Expired',
      content: 'Your session has expired. Please refresh your session or logout.',
      okText: 'Refresh Session',
      cancelText: 'Logout',
      mask: {
        closable: false
      },
      onOk: () => onOkFunc(),
      onCancel: () => onCancelFunc(),
    })
  }

  return { showTimeoutModal, contextHolder }
}