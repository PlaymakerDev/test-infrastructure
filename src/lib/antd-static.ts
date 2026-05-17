import type { ModalStaticFunctions } from 'antd/es/modal/confirm'
import { Modal } from 'antd'

// Holds the App-context-aware modal instance once the client tree mounts.
// Falls back to the static Modal (which triggers the warning) until then.
let _modal: ModalStaticFunctions = Modal

export const setModalInstance = (modal: ModalStaticFunctions) => {
  _modal = modal
}

export const getModal = (): ModalStaticFunctions => _modal
