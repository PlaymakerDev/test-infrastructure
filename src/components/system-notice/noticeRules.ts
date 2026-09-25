import { SYSTEM_MENU_PATH, SYSTEM_TYPES, type SystemType } from '@/features/admin/dashboard/data/systems'

/** How long the notice stays up before closing itself (user 2026-09-24). */
export const NOTICE_DURATION_MS = 20_000

/** Key for GET /manage/feature-updates/:feature — each menu's URL segment
 *  (lpr, cctv, traffic-volume, …). The backend's own examples (vms,
 *  maintenance) are menu names too, and `lpr` was the first key it set up. */
export const SYSTEM_FEATURE_KEY = Object.fromEntries(
  SYSTEM_TYPES.map((type) => [type, SYSTEM_MENU_PATH[type].replace(/^\/admin\//, '')]),
) as Record<SystemType, string>

/** Which system's menu a route belongs to. Segment-aware, so /admin/vms does
 *  not claim /admin/vms-command-center. */
export const systemOfPath = (pathname: string): SystemType | null => {
  for (const type of SYSTEM_TYPES) {
    const base = SYSTEM_MENU_PATH[type]
    if (pathname === base || pathname.startsWith(`${base}/`)) return type
  }
  return null
}

const TYPE_BY_KEY = new Map<string, SystemType>([
  ...SYSTEM_TYPES.map((type) => [type.toLowerCase(), type] as const),
  ...SYSTEM_TYPES.map((type) => [SYSTEM_FEATURE_KEY[type], type] as const),
])

/** `?maintenance_preview=` value → systems, in navbar order. Accepts system
 *  keys (LPR, VMS) or feature keys (lpr, traffic-volume), any case. */
export const parsePreviewTypes = (raw: string | null): SystemType[] => {
  const wanted = new Set(
    (raw ?? '').split(',').map((s) => TYPE_BY_KEY.get(s.trim().toLowerCase())).filter(Boolean),
  )
  return SYSTEM_TYPES.filter((type) => wanted.has(type))
}

/** Shown when a system has no title / text of its own (e.g. a preview). */
export const DEFAULT_NOTICE_TITLE = 'ขออภัยในความไม่สะดวก'
export const DEFAULT_NOTICE_LINES = [
  'ขณะนี้ระบบอยู่ระหว่างการปรับปรุง',
  'เพื่อเพิ่มประสิทธิภาพการให้บริการให้สะดวกและรวดเร็วยิ่งขึ้น',
]

/** The backend's `title` + `content` for one system. */
export interface NoticeText {
  title?: string | null
  content?: string | null
}

/** Backend text → display lines. Splits on real newlines AND on a literal
 *  "\n" (backslash + n), which is how the first production row stored it. */
export const toNoticeLines = (content: string | null | undefined): string[] =>
  (content ?? '').split(/\\n|\r?\n/).map((line) => line.trim()).filter(Boolean)

export interface NoticeMessage {
  systems: SystemType[]
  title: string
  lines: string[]
}

/** One message per distinct title + text, so systems sharing both show once. */
export const groupNoticeMessages = (
  types: SystemType[],
  notices: Partial<Record<SystemType, NoticeText>>,
): NoticeMessage[] => {
  const groups = new Map<string, NoticeMessage>()
  for (const type of types) {
    const title = notices[type]?.title?.trim() || DEFAULT_NOTICE_TITLE
    const lines = toNoticeLines(notices[type]?.content)
    const shown = lines.length > 0 ? lines : DEFAULT_NOTICE_LINES
    const key = `${title}\u0000${shown.join('\n')}`
    const group = groups.get(key)
    if (group) group.systems.push(type)
    else groups.set(key, { systems: [type], title, lines: shown })
  }
  return [...groups.values()]
}
