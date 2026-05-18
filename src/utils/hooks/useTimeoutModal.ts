import { App } from "antd"
import { AxiosError } from "axios"

type ModalInstance = ReturnType<typeof App.useApp>["modal"]

let _modal: ModalInstance | null = null

export const setGlobalModal = (modal: ModalInstance) => {
	_modal = modal
}

export const getGlobalModal = (): ModalInstance | null => _modal

export const useTimeoutModal = () => {
	const { modal } = App.useApp()

	const showTimeoutModal = (
		_error: AxiosError,
		onOkFunc: () => void,
		onCancelFunc: () => void
	) => {
		modal.confirm({
			title: "Session Expired",
			content: "Your session has expired. Please refresh your session or logout.",
			okText: "Refresh Session",
			cancelText: "Logout",
			mask: { closable: false },
			onOk: () => onOkFunc(),
			onCancel: () => onCancelFunc(),
		})
	}

	return { showTimeoutModal }
}
