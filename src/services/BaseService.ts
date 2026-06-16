import axios, { type AxiosError } from "axios"
import { getGlobalModal } from "@/utils/hooks/useTimeoutModal"

declare module "axios" {
	interface InternalAxiosRequestConfig {
		_retry?: boolean
	}
}

const TOKEN_EXPIRED_CODE = 40199
const TOKEN_INVALID_CODE = 40100
const LOGIN_PATH = "/auth/login"

// ---- Session cache: dedupe concurrent /api/auth/session fetches ----
type SessionJSON = { access_token?: string | null; refresh_token?: string | null }

let sessionPromise: Promise<SessionJSON> | null = null
let sessionCacheAt = 0
const SESSION_CACHE_TTL = 5000

function invalidateSessionCache() {
	sessionPromise = null
	sessionCacheAt = 0
}

async function fetchSessionJSON(): Promise<SessionJSON> {
	const now = Date.now()
	if (sessionPromise && now - sessionCacheAt < SESSION_CACHE_TTL) {
		return sessionPromise
	}
	sessionCacheAt = now
	sessionPromise = (async () => {
		try {
			const res = await fetch("/api/auth/session")
			if (!res.ok) return {}
			if (!res.headers.get("content-type")?.includes("application/json")) return {}
			return (await res.json()) as SessionJSON
		} catch {
			invalidateSessionCache()
			return {}
		}
	})()
	return sessionPromise
}

// ---- Refresh lock: one refresh in flight; concurrent failures queue then retry ----
let isRefreshing = false
let isInvalidModalShown = false
let subscribers: Array<{ resolve: () => void; reject: (e: unknown) => void }> = []

const notifyRefreshed = () => {
	subscribers.forEach((s) => s.resolve())
	subscribers = []
}
const notifyRefreshFailed = (e: unknown) => {
	subscribers.forEach((s) => s.reject(e))
	subscribers = []
}
const waitForRefresh = () =>
	new Promise<void>((resolve, reject) => subscribers.push({ resolve, reject }))

const BaseService = axios.create({
	timeout: 60000,
	baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND,
})

BaseService.interceptors.request.use(
	async (config) => {
		const { access_token } = await fetchSessionJSON()
		if (access_token) config.headers["Authorization"] = `Bearer ${access_token}`
		if (process.env.NEXT_PUBLIC_API_KEY) config.headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY
		return config
	},
	(error) => Promise.reject(error),
)

const logout = async () => {
	try {
		await axios.post("/api/auth/logout", {})
	} catch {
		// ignore API failure — always redirect
	}
	invalidateSessionCache()
	if (typeof window !== "undefined") window.location.href = LOGIN_PATH
}

// Silent refresh on expiry/401 — no confirm modal.
async function handleTokenExpired(error: AxiosError) {
	const { config } = error
	if (!config || config._retry) return Promise.reject(error)

	config._retry = true

	if (isRefreshing) {
		try {
			await waitForRefresh()
			return BaseService(config)
		} catch {
			return Promise.reject(error)
		}
	}

	isRefreshing = true
	try {
		const { refresh_token } = await fetchSessionJSON()
		await axios.post("/api/auth/refresh", { refresh_token })
		invalidateSessionCache()
		isRefreshing = false
		notifyRefreshed()
		return BaseService(config)
	} catch (err) {
		isRefreshing = false
		notifyRefreshFailed(err)
		await logout()
		return Promise.reject(error)
	}
}

BaseService.interceptors.response.use(
	(response) => response,
	async (error) => {
		const { response } = error
		const resCode = response?.data?.res_code

		// Invalid token (40100) — check FIRST (also returns HTTP 401). One modal, then logout.
		if (resCode === TOKEN_INVALID_CODE) {
			const modal = getGlobalModal()
			if (modal && !isInvalidModalShown) {
				isInvalidModalShown = true
				modal.error({
					title: "Session Invalid",
					content: "Your session is invalid. Please login again.",
					okText: "Logout",
					mask: { closable: false },
					onOk: () => {
						isInvalidModalShown = false
						return logout()
					},
				})
			} else if (!modal) {
				await logout()
			}
			return Promise.reject(error)
		}

		// Expired token (40199) OR bare HTTP 401 → silent refresh + retry.
		if (resCode === TOKEN_EXPIRED_CODE || response?.status === 401) {
			return handleTokenExpired(error)
		}

		return Promise.reject(error)
	},
)

export default BaseService
