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
type SessionJSON = { access_token?: string | null; refresh_at?: number; expires_at?: number }

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
			if (!res.ok) { invalidateSessionCache(); return {} }
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
let isExpiredModalShown = false
let proactiveRefreshFailed = false
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

// ---- Expires modal lock: session hard-expiry confirmation in flight ----
let isExpiresModalPending = false
let expiresSubscribers: Array<{ resolve: () => void; reject: (e: unknown) => void }> = []

const notifyExpiresResolved = () => {
	expiresSubscribers.forEach((s) => s.resolve())
	expiresSubscribers = []
}
const notifyExpiresFailed = (e: unknown) => {
	expiresSubscribers.forEach((s) => s.reject(e))
	expiresSubscribers = []
}
const waitForExpires = () =>
	new Promise<void>((resolve, reject) => expiresSubscribers.push({ resolve, reject }))

const BaseService = axios.create({
	timeout: 60000,
	baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND,
})

const logout = async () => {
	try {
		await axios.post("/api/auth/logout", {})
	} catch {
		// ignore API failure — always redirect
	}
	invalidateSessionCache()
	if (typeof window !== "undefined") window.location.href = LOGIN_PATH
}

BaseService.interceptors.request.use(
	async (config) => {
		// A refresh is already in flight — wait for the new token before injecting
		if (isRefreshing) {
			try {
				await waitForRefresh()
			} catch {
				return Promise.reject(new Error('Token refresh failed'))
			}
		// Session-expiry modal is open — wait for user's decision before proceeding
		} else if (isExpiresModalPending) {
			try {
				await waitForExpires()
			} catch {
				return Promise.reject(new Error('Session expired'))
			}
		} else {
			const session = await fetchSessionJSON()
			const now = Date.now()

			// expires_at: 30-day inactivity hard-expiry — requires user confirmation
			if (session.expires_at && session.expires_at > 0 && now >= session.expires_at) {
				const modal = getGlobalModal()
				if (modal) {
					isExpiresModalPending = true
					await new Promise<void>((resolve, reject) => {
						modal.confirm({
							title: 'Session หมดอายุ',
							content: 'Session ของคุณหมดอายุแล้ว กรุณาต่ออายุเพื่อดำเนินการต่อ หรือออกจากระบบ',
							okText: 'ต่ออายุ Session',
							cancelText: 'ออกจากระบบ',
							mask: { closable: false },
							onOk: async () => {
								try {
									isRefreshing = true
									await axios.post('/api/auth/refresh', {})
									invalidateSessionCache()
									isRefreshing = false
									notifyRefreshed()
									isExpiresModalPending = false
									notifyExpiresResolved()
									resolve()
								} catch {
									isRefreshing = false
									notifyRefreshFailed(new Error('Refresh failed'))
									isExpiresModalPending = false
									notifyExpiresFailed(new Error('Session expired'))
									await logout()
									reject(new Error('Session expired'))
								}
							},
							onCancel: async () => {
								isExpiresModalPending = false
								notifyExpiresFailed(new Error('User chose logout'))
								await logout()
								reject(new Error('Session expired — user chose logout'))
							},
						})
					})
				} else {
					// No modal provider — logout directly
					await logout()
					return Promise.reject(new Error('Session expired'))
				}
			// refresh_at: 12-min proactive silent refresh
			// If the previous proactive attempt already failed, skip — let backend 40199 handle it
			} else if (!proactiveRefreshFailed && session.refresh_at && session.refresh_at > 0 && now >= session.refresh_at) {
				isRefreshing = true
				try {
					await axios.post('/api/auth/refresh', {})
					invalidateSessionCache()
					isRefreshing = false
					proactiveRefreshFailed = false
					notifyRefreshed()
				} catch {
					isRefreshing = false
					notifyRefreshFailed(new Error('Proactive refresh failed'))
					// Don't logout — current token may still be valid.
					// Set flag so we stop retrying on every request; backend 40199 will trigger
					// the proper modal flow when the token actually expires.
					proactiveRefreshFailed = true
				}
			}
		}

		const { access_token } = await fetchSessionJSON()
		if (access_token) config.headers["Authorization"] = `Bearer ${access_token}`
		if (process.env.NEXT_PUBLIC_API_KEY) config.headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY
		return config
	},
	(error) => Promise.reject(error),
)

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
		await axios.post("/api/auth/refresh", {})
		invalidateSessionCache()
		isRefreshing = false
		proactiveRefreshFailed = false
		notifyRefreshed()
		return BaseService(config)
	} catch (err) {
		isRefreshing = false
		notifyRefreshFailed(err)
		// Show a modal before logging out so the user isn't silently kicked out
		const modal = getGlobalModal()
		if (modal && !isExpiredModalShown && !isInvalidModalShown) {
			isExpiredModalShown = true
			modal.error({
				title: 'เซสชันหมดอายุ',
				content: 'ไม่สามารถต่ออายุเซสชันได้ กรุณาเข้าสู่ระบบใหม่',
				okText: 'เข้าสู่ระบบใหม่',
				mask: { closable: false },
				onOk: () => {
					isExpiredModalShown = false
					return logout()
				},
			})
		} else if (!modal) {
			await logout()
		}
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
