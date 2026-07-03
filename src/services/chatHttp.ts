// Axios instance for the AI Chat backend (a separate host from BaseService,
// set via NEXT_PUBLIC_CHAT_API). Non-streaming endpoints only — `/ask`
// streaming uses chatStream.ts.
//
// Reuses the app's auth: the JWT is read from the iron-session cookie via
// GET /api/auth/session and attached as Bearer on every request. On res_code
// 40199 (token expired) it silently refreshes the session and retries once.
// Other auth failures are rejected and surfaced by the caller — chat is a
// separate service, so its auth errors never log the user out of the whole app.
import axios from "axios"
import type { InternalAxiosRequestConfig } from "axios"
import { CHAT_BASE } from "./chatBase"
import {
  debugChatAuth,
  getChatAccessToken,
  isTokenExpired,
  refreshChatSession,
} from "./chatAuth"

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const API_KEY = process.env.NEXT_PUBLIC_API_KEY

const chatHttp = axios.create({
  timeout: 60000,
  baseURL: CHAT_BASE, // already includes the chat prefix (/api/chat or /chat)
})

chatHttp.interceptors.request.use(async (config) => {
  const token = await getChatAccessToken()

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`
  }
  if (API_KEY) {
    config.headers["x-api-key"] = API_KEY
  }

  return config
})

chatHttp.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config as RetryableConfig | undefined
    const resCode = error?.response?.data?.res_code

    if (resCode || error?.response?.status) {
      debugChatAuth("request failed", {
        url: config?.url,
        status: error?.response?.status,
        resCode,
      })
    }

    // Expired token (recoverable): refresh once and retry. Any other failure
    // (incl. 40100 invalid) is rejected for the caller to surface — no logout.
    if (isTokenExpired(resCode) && config && !config._retry) {
      config._retry = true
      if (await refreshChatSession()) {
        return chatHttp(config) // request interceptor re-fetches the new token
      }
    }

    return Promise.reject(error)
  },
)

export default chatHttp
