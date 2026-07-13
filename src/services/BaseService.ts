import axios, { type AxiosError } from "axios"

declare module "axios" {
	interface InternalAxiosRequestConfig {
		_retry?: boolean
	}
}

const TOKEN_EXPIRED_CODE = 40199
const TOKEN_INVALID_CODE = 40100
// Hard window.location navigations aren't basePath-prefixed automatically.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ""
const LOGIN_PATH = "/auth/login"

// ---- Session cache: dedupe concurrent /api/auth/session reads (15s) ----
type SessionJSON = { access_token?: string | null; refresh_at?: number }

let sessionPromise: Promise<SessionJSON> | null = null
let sessionCacheAt = 0
const SESSION_CACHE_TTL = 15_000

function invalidateSessionCache() {
	sessionPromise = null
	sessionCacheAt = 0
}

async function fetchSessionJSON(): Promise<SessionJSON> {
	const now = Date.now()
	if (sessionPromise && now - sessionCacheAt < SESSION_CACHE_TTL) return sessionPromise
	sessionCacheAt = now
	sessionPromise = (async () => {
		// Retry once: the route can briefly return 500/non-JSON while Next recompiles (dev).
		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				const res = await fetch("/api/auth/session")
				if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
					return (await res.json()) as SessionJSON
				}
			} catch {
				// fall through to retry / give up
			}
			if (attempt === 0) await new Promise((r) => setTimeout(r, 500))
		}
		invalidateSessionCache()
		return {}
	})()
	return sessionPromise
}

// ---- Refresh ----
type RefreshErrorKind = "transient" | "invalid"

// Logout only on a definitive refresh rejection (res_code 40100). Everything else
// (bare 401 / 5xx / network / 40199) is transient → retry, never sign out on a blip.
function classifyRefreshError(err: unknown): RefreshErrorKind {
	if (!err || typeof err !== "object") return "transient"
	const anyErr = err as { response?: { data?: { res_code?: number } } }
	return anyErr.response?.data?.res_code === TOKEN_INVALID_CODE ? "invalid" : "transient"
}

// Serialize refresh across tabs + the chat transport. The backend rotates (and
// invalidates) the refresh token, so two concurrent refreshers make the loser get
// 40100 and false-logout. Same lock name as chatAuth.ts — keep in sync.
export const AUTH_REFRESH_LOCK = "drr-auth-refresh"
function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
	const locks = typeof navigator !== "undefined" ? navigator.locks : undefined
	if (!locks?.request) return fn()
	// Web Locks resolves with the callback's resolved value (T); its typing nests it.
	return locks.request(AUTH_REFRESH_LOCK, fn) as Promise<T>
}

// 3 attempts [0, 800, 2000]ms; fail-fast on a definitive-invalid token.
async function refreshWithRetry(): Promise<void> {
	return withRefreshLock(async () => {
		const delays = [0, 800, 2000]
		let lastErr: unknown
		for (let i = 0; i < delays.length; i++) {
			if (delays[i] > 0) await new Promise((r) => setTimeout(r, delays[i]))
			try {
				await axios.post("/api/auth/refresh", {})
				return
			} catch (err) {
				lastErr = err
				if (classifyRefreshError(err) === "invalid") throw err
			}
		}
		throw lastErr
	})
}

// ---- Single-flight: one refresh at a time; other requests queue for it ----
let isRefreshing = false
let proactiveCooldownUntil = 0 // skip proactive refresh for 60s after a failure
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

// ---- Background auto-refresh timer ----
// Refreshes at refresh_at even when idle (no request to trigger the proactive
// check), so a 24/7 dashboard never lapses into a 401 hiccup.
let refreshTimer: ReturnType<typeof setTimeout> | null = null
let refreshTimerFor = 0 // refresh_at the timer is armed for (idempotent re-arm)

function clearRefreshTimer() {
	if (refreshTimer) clearTimeout(refreshTimer)
	refreshTimer = null
	refreshTimerFor = 0
}

function armRefreshTimer(refreshAt: number) {
	if (typeof window === "undefined" || refreshAt <= 0) return
	if (refreshTimer && refreshTimerFor === refreshAt) return
	if (refreshTimer) clearTimeout(refreshTimer)
	refreshTimerFor = refreshAt
	refreshTimer = setTimeout(runScheduledRefresh, Math.max(1000, refreshAt - Date.now()))
}

async function runScheduledRefresh() {
	refreshTimer = null
	refreshTimerFor = 0
	if (typeof window === "undefined") return
	const { refresh_at } = await fetchSessionJSON()
	if (!refresh_at || refresh_at <= 0) return // logged out
	if (refresh_at > Date.now()) return armRefreshTimer(refresh_at) // refreshed elsewhere → re-arm
	if (isRefreshing) return armRefreshTimer(Date.now() + 5_000) // in flight → recheck soon
	isRefreshing = true
	try {
		await refreshWithRetry()
		invalidateSessionCache()
		isRefreshing = false
		proactiveCooldownUntil = 0
		notifyRefreshed()
	} catch {
		isRefreshing = false
		notifyRefreshed()
		proactiveCooldownUntil = Date.now() + 60_000
	}
	const next = (await fetchSessionJSON()).refresh_at
	armRefreshTimer(next && next > Date.now() ? next : Date.now() + 60_000) // retry in 60s if still due
}

const BaseService = axios.create({
	timeout: 60000,
	baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND,
})

const logout = async () => {
	try {
		await axios.post("/api/auth/logout", {})
	} catch {
		// ignore — redirect regardless
	}
	invalidateSessionCache()
	clearRefreshTimer()
	// Clean redirect (no modal); ?session_expired=1 lets the login page show a notice.
	if (typeof window !== "undefined") {
		window.location.href = `${BASE_PATH}${LOGIN_PATH}?session_expired=1`
	}
}

BaseService.interceptors.request.use(
	async (config) => {
		if (isRefreshing) {
			try {
				await waitForRefresh()
			} catch {
				return Promise.reject(new Error("Token refresh failed"))
			}
		} else {
			const session = await fetchSessionJSON()
			const now = Date.now()
			// Proactive silent refresh once past refresh_at; a failure just cools down (never logs out).
			if (
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
				} catch {
					isRefreshing = false
					notifyRefreshed()
					proactiveCooldownUntil = now + 60_000
				}
			}
		}

		const { access_token, refresh_at } = await fetchSessionJSON()
		if (access_token) config.headers["Authorization"] = `Bearer ${access_token}`
		if (process.env.NEXT_PUBLIC_API_KEY) config.headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY
		armRefreshTimer(refresh_at ?? 0)
		return config
	},
	(error) => Promise.reject(error),
)

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
	const tokenBefore = (await fetchSessionJSON()).access_token
	try {
		await refreshWithRetry()
		invalidateSessionCache()
		isRefreshing = false
		proactiveCooldownUntil = 0
		notifyRefreshed()
		return BaseService(config)
	} catch (err) {
		isRefreshing = false
		if (classifyRefreshError(err) === "invalid") {
			// 40100 can also be a rotation race (another tab/chat rotated the token). If
			// the cookie's access token changed under us, the session is alive → retry.
			invalidateSessionCache()
			const current = (await fetchSessionJSON()).access_token
			if (current && current !== tokenBefore) {
				notifyRefreshed()
				return BaseService(config)
			}
			notifyRefreshFailed(err) // genuinely dead → sign out
			await logout()
		} else {
			notifyRefreshFailed(err) // transient → keep session, fail this request
			proactiveCooldownUntil = Date.now() + 60_000
		}
		return Promise.reject(error)
	}
}

BaseService.interceptors.response.use(
	(response) => response,
	async (error) => {
		const { response } = error
		const resCode = response?.data?.res_code
		// Expired (40199) / invalid (40100) / bare 401 → one silent refresh + retry.
		// Routing 40100 here (not instant logout) lets a stale/rotated token recover.
		if (resCode === TOKEN_INVALID_CODE || resCode === TOKEN_EXPIRED_CODE || response?.status === 401) {
			return handleTokenExpired(error)
		}
		return Promise.reject(error)
	},
)

export default BaseService
