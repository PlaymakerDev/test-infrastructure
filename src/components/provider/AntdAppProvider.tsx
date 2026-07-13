"use client"
import { App } from "antd"

const AntdAppProvider = ({ children }: { children: React.ReactNode }) => {
	return <App>{children}</App>
}

export default AntdAppProvider
