import { useMemo, useSyncExternalStore } from 'react'
import { useFeatureUpdates } from '@/hooks/queries/manage'
import { SYSTEM_TYPES, type SystemType } from '@/features/admin/dashboard/data/systems'
import { SYSTEM_FEATURE_KEY, parsePreviewTypes, systemOfPath, type NoticeText } from './noticeRules'

const LOGIN_FLAG_KEY = 'atlas:maintenance-notice:login'
const LOGIN_EVENT = 'atlas:maintenance-notice:login-change'
const PREVIEW_KEY = 'atlas:maintenance-notice:preview'
const PREVIEW_PARAM = 'maintenance_preview'
const PREVIEW_EVENT = 'atlas:maintenance-notice:preview-change'

/* ── login trigger ─────────────────────────────────────────────────────────
 * The login screen marks the flag right before it navigates into the app;
 * the notice clears it once it has opened (or once the data says there is
 * nothing to show), so a cancelled attempt — StrictMode's double effect run,
 * data still loading — keeps it. While it is set, every menu's feature key
 * is fetched; after that, only the current menu's. */

const notifyLogin = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LOGIN_EVENT))
}

export const markLoginForNotice = () => {
  try { sessionStorage.setItem(LOGIN_FLAG_KEY, '1') } catch { /* storage blocked */ }
  notifyLogin()
}

export const hasLoginNoticePending = (): boolean => {
  try { return sessionStorage.getItem(LOGIN_FLAG_KEY) === '1' } catch { return false }
}

export const clearLoginNotice = () => {
  try { sessionStorage.removeItem(LOGIN_FLAG_KEY) } catch { /* storage blocked */ }
  notifyLogin()
}

const subscribeLogin = (onChange: () => void) => {
  window.addEventListener(LOGIN_EVENT, onChange)
  return () => window.removeEventListener(LOGIN_EVENT, onChange)
}

/* ── preview ───────────────────────────────────────────────────────────────
 * Per-browser, on top of the real data: open any /admin page with
 * `?maintenance_preview=LPR,VMS` to see how other systems would look; it
 * sticks to that browser until `?maintenance_preview=off`. Nobody else sees it. */

/** Applies `?maintenance_preview=` from the current URL, if present. Returns
 *  true when a non-empty preview was just switched on. */
export const applyPreviewParam = (): boolean => {
  if (typeof window === 'undefined') return false
  const value = new URLSearchParams(window.location.search).get(PREVIEW_PARAM)
  if (value === null) return false
  const turnedOn = value.trim().toLowerCase() !== 'off' && parsePreviewTypes(value).length > 0
  try {
    if (turnedOn) localStorage.setItem(PREVIEW_KEY, value)
    else localStorage.removeItem(PREVIEW_KEY)
  } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(PREVIEW_EVENT))
  return turnedOn
}

const subscribePreview = (onChange: () => void) => {
  window.addEventListener(PREVIEW_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(PREVIEW_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

const readPreviewRaw = (): string | null => {
  try { return localStorage.getItem(PREVIEW_KEY) } catch { return null }
}

const ALL_FEATURE_KEYS = SYSTEM_TYPES.map((type) => SYSTEM_FEATURE_KEY[type])

export interface MaintenanceNotices {
  /** Systems under maintenance among those checked, in navbar order. */
  types: SystemType[]
  /** The backend's title + text per system (absent for preview-only ones). */
  notices: Partial<Record<SystemType, NoticeText>>
  /** Every feature-update request in flight has finished. */
  ready: boolean
  /** A login notice is still owed. */
  loginPending: boolean
}

/** Systems under maintenance: an active GET /manage/feature-updates/:feature
 *  row for the menu key, plus this browser's preview, if any.
 *
 *  Only the current menu's key is fetched (none on non-system pages such as
 *  the dashboard). The one exception is right after login, when the notice
 *  must name every system under maintenance and the API has no "all
 *  features" call — then every key is fetched, once. */
export const useMaintenanceNotices = (pathname: string): MaintenanceNotices => {
  const previewRaw = useSyncExternalStore(subscribePreview, readPreviewRaw, () => null)
  const loginPending = useSyncExternalStore(subscribeLogin, hasLoginNoticePending, () => false)
  const system = systemOfPath(pathname)
  const features = useMemo(
    () => (loginPending ? ALL_FEATURE_KEYS : system ? [SYSTEM_FEATURE_KEY[system]] : []),
    [loginPending, system],
  )
  const { latest, settled } = useFeatureUpdates(features)
  return useMemo(() => {
    const preview = new Set(parsePreviewTypes(previewRaw))
    const notices: Partial<Record<SystemType, NoticeText>> = {}
    const types = SYSTEM_TYPES.filter((type) => {
      const row = latest[SYSTEM_FEATURE_KEY[type]]
      if (row) notices[type] = { title: row.title, content: row.content }
      return Boolean(row) || preview.has(type)
    })
    return { types, notices, ready: settled, loginPending }
  }, [previewRaw, latest, settled, loginPending])
}
