import axios from "axios"
import { getGlobalModal } from "@/utils/hooks/useTimeoutModal"

const unauthorizedCode = [401]
const TOKEN_EXPIRED_CODE = 40199
const TOKEN_INVALID_CODE = 40100

const BaseService = axios.create({
	timeout: 60000,
	baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND
})

BaseService.interceptors.request.use(
	async (config) => {
		const res = await fetch("/api/auth/session")
		const { access_token } = await res.json()

		if (access_token) {
			config.headers["Authorization"] = `Bearer ${access_token}`
		}

		if (process.env.NEXT_PUBLIC_API_KEY) {
			config.headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY
		}

		const base = (config.baseURL ?? "").replace(/\/+$/, "")
		const path = (config.url ?? "").replace(/^\/+/, "")
		console.log("[REQ]", `${base}/${path}`, config.params ?? {}, config.method)

		return config
	},
	(error) => {
		return Promise.reject(error)
	},
)

const logout = async () => {
	await axios.post("/api/auth/logout", {})
	if (typeof window !== "undefined") {
		window.location.href = "/auth/login"
	}
}

BaseService.interceptors.response.use(
	(response) => response,
	async (error) => {
		const { response, config } = error

		// Handle token expiration: res_code 40199
		if (response?.data?.res_code === TOKEN_EXPIRED_CODE) {
			if (config._retry) return Promise.reject(error) // already retried, give up
			config._retry = true

			const sessionRes = await fetch("/api/auth/session")
			const { refresh_token } = await sessionRes.json()

			return new Promise((resolve, reject) => {
				getGlobalModal()?.confirm({
					title: "Session Expired",
					content: "Your session has expired. Would you like to refresh it?",
					okText: "Refresh Session",
					cancelText: "Logout",
					onOk: async () => {
						try {
							await axios.post("/api/auth/refresh", { refresh_token })
							resolve(BaseService(config))
						} catch {
							await logout()
							reject(error)
						}
					},
					onCancel: async () => {
						await logout()
						reject(error)
					},
				})
			})
		}

		// Handle invalid token: res_code 40100
		if (response?.data?.res_code === TOKEN_INVALID_CODE) {
			getGlobalModal()?.error({
				title: "Session Invalid",
				content: "Your session is invalid. Please login again.",
				okText: "Logout",
				mask: { closable: false },
				onOk: logout,
			})
			return Promise.reject(error)
		}

		if (response && unauthorizedCode.includes(response.status)) {
			await logout()
		}

		return Promise.reject(error)
	},
)

export default BaseService
