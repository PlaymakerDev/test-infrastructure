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
const SESSION_CACHE_TTL = 15_000

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
		// Tolerate the dev-server rebuild race: if the /api/auth/session route is
		// mid-recompile it may briefly return 500 or non-JSON. Retry once before
		// giving up rather than invalidating the whole session view.
		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				const res = await fetch("/api/auth/session")
				if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
					return (await res.json()) as SessionJSON
				}
				// 5xx / non-JSON — likely Next.js recompiling. Pause briefly then retry.
				if (attempt === 0) {
					console.warn("[auth] /api/auth/session returned non-OK/non-JSON; retrying in 500ms")
					await new Promise((r) => setTimeout(r, 500))
					continue
				}
			} catch {
				if (attempt === 0) {
					console.warn("[auth] /api/auth/session fetch threw; retrying in 500ms")
					await new Promise((r) => setTimeout(r, 500))
					continue
				}
			}
		}
		invalidateSessionCache()
		return {}
	})()
	return sessionPromise
}

// ---- Refresh error classification ----
type RefreshErrorKind = "transient" | "invalid" | "unknown"

function classifyRefreshError(err: unknown): RefreshErrorKind {
	if (!err || typeof err !== "object") return "unknown"
	const anyErr = err as {
		response?: { status?: number; data?: { res_code?: number } }
		code?: string
	}
	const status = anyErr.response?.status
	const resCode = anyErr.response?.data?.res_code
	// Real invalid — must force re-login
	if (resCode === TOKEN_INVALID_CODE) return "invalid"
	if (status === 401 && resCode !== TOKEN_EXPIRED_CODE) return "invalid"
	// Transient — 5xx, network, or 40199 (a fresh refresh should succeed next attempt)
	if (status && status >= 500) return "transient"
	if (!status) return "transient" // no response = network error
	if (resCode === TOKEN_EXPIRED_CODE) return "transient"
	return "unknown"
}

// Retry-with-backoff wrapper around the /api/auth/refresh call.
// Attempts: 3 total with delays [0ms, 800ms, 2000ms]. Fails fast on 'invalid'.
async function refreshWithRetry(): Promise<void> {
	const delays = [0, 800, 2000]
	let lastErr: unknown
	for (let i = 0; i < delays.length; i++) {
		if (delays[i] > 0) await new Promise((r) => setTimeout(r, delays[i]))
		try {
			await axios.post("/api/auth/refresh", {})
			return
		} catch (err) {
			lastErr = err
			const kind = classifyRefreshError(err)
			if (kind === "invalid") throw err // fail fast — real invalid token
			const more = i + 1 < delays.length
			console.warn(
				`[auth] refresh attempt ${i + 1}/${delays.length} failed (${kind}); ${
					more ? "retrying" : "giving up"
				}`,
			)
		}
	}
	throw lastErr
}

// ---- Refresh lock: one refresh in flight; concurrent failures queue then retry ----
let isRefreshing = false
let isInvalidModalShown = false
let isExpiredModalShown = false
// Cooldown after a proactive refresh failure — instead of the old sticky
// `proactiveRefreshFailed` boolean which killed proactive refresh for the
// whole session on a single blip, we simply skip proactive refresh for 60s
// and try again on the next request after that.
let proactiveCooldownUntil = 0
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
									await refreshWithRetry()
									invalidateSessionCache()
									isRefreshing = false
									proactiveCooldownUntil = 0
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
			// refresh_at: 12-min proactive silent refresh.
			// After a failure we honor a 60s cooldown before trying again rather
			// than disabling proactive refresh for the entire session.
			} else if (
				now >= proactiveCooldownUntil &&
				session.refresh_at && session.refresh_at > 0 && now >= session.refresh_at
			) {
				isRefreshing = true
				try {
					await refreshWithRetry()
					invalidateSessionCache()
					isRefreshing = false
					proactiveCooldownUntil = 0
					notifyRefreshed()
				} catch (err) {
					isRefreshing = false
					const kind = classifyRefreshError(err)
					if (kind === "invalid") {
						// Real invalid token — surface to callers so the reactive
						// path / 40100 handler shows the correct modal.
						notifyRefreshFailed(err)
					} else {
						// Transient/unknown — do NOT log the user out and do NOT
						// notify subscribers as failed (they'd surface errors to
						// callers). Just resolve them so the current request
						// proceeds with the still-likely-valid access token; if
						// the backend disagrees, the response interceptor will
						// take over.
						notifyRefreshed()
						proactiveCooldownUntil = now + 60_000
						console.warn('[auth] proactive refresh failed (transient); cooling down 60s')
					}
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
		await refreshWithRetry()
		invalidateSessionCache()
		isRefreshing = false
		proactiveCooldownUntil = 0
		notifyRefreshed()
		return BaseService(config)
	} catch (err) {
		isRefreshing = false
		notifyRefreshFailed(err)
		const kind = classifyRefreshError(err)
		// Only prompt the user to re-login when the refresh failed because the
		// token was genuinely invalid. Transient (5xx / network) failures should
		// just fail the current request silently — the user can retry, and the
		// next request will attempt refresh again.
		if (kind === "invalid") {
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
		} else {
			// Transient/unknown — keep the session; just cool down proactive refresh briefly.
			proactiveCooldownUntil = Date.now() + 60_000
			console.warn('[auth] reactive refresh failed (transient); leaving session intact')
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
