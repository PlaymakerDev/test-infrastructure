"use client"
import { App } from "antd"
import { useEffect } from "react"
import { setGlobalModal } from "@/utils/hooks/useTimeoutModal"

const ModalRegistrar = () => {
	const { modal } = App.useApp()

	useEffect(() => {
		setGlobalModal(modal)
	}, [modal])

	return null
}

const AntdAppProvider = ({ children }: { children: React.ReactNode }) => {
	return (
		<App>
			<ModalRegistrar />
			{children}
		</App>
	)
}

export default AntdAppProvider
