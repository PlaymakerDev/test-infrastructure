'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { SystemType } from '@/features/admin/dashboard/data/systems'
import MaintenanceNoticeModal from './MaintenanceNoticeModal'
import {
  applyPreviewParam,
  clearLoginNotice,
  markLoginForNotice,
  useMaintenanceNotices,
} from './maintenanceNotice'
import { NOTICE_DURATION_MS, systemOfPath, type NoticeText } from './noticeRules'

type NoticeTexts = Partial<Record<SystemType, NoticeText>>

interface OpenNotice {
  id: number
  types: SystemType[]
  /** Snapshot taken on opening. The live data can't be used: opening the login
   *  notice clears the login flag, which narrows the fetch to the current
   *  menu and would drop the other systems' titles while it is still up. */
  texts: NoticeTexts
}

const NO_TEXTS: NoticeTexts = {}

/** Let the page paint first, so the notice doesn't flash over a loading screen. */
const OPEN_DELAY_MS = 400

/** Decides when the "ขออภัยในความไม่สะดวก" notice opens:
 *  - right after login → every system under maintenance;
 *  - on entering a menu that is under maintenance → just that one, once per
 *    visit (moving between that menu's own pages doesn't reopen it).
 *  It closes itself after NOTICE_DURATION_MS. Mounted once in Layout, so it
 *  sees every /admin route change. */
const SystemMaintenanceNotice: React.FC = () => {
  const pathname = usePathname()
  const { types, notices, ready, loginPending } = useMaintenanceNotices(pathname)
  const [notice, setNotice] = useState<OpenNotice | null>(null)

  const visitRef = useRef<SystemType | null | undefined>(undefined)
  const announcedRef = useRef(false)
  const nextIdRef = useRef(0)

  // Switching a preview on shows it straight away, the way a fresh login would.
  useEffect(() => {
    if (applyPreviewParam()) markLoginForNotice()
  }, [pathname])

  useEffect(() => {
    const system = systemOfPath(pathname)
    if (system !== visitRef.current) {
      visitRef.current = system
      announcedRef.current = false
    }

    // Nothing under maintenance at login: drop the flag, or a notice switched
    // on hours later would pop up as though the user had just logged in.
    if (loginPending && ready && types.length === 0) clearLoginNotice()

    const fromLogin = loginPending && types.length > 0
    const next = fromLogin
      ? types
      : !announcedRef.current && system && types.includes(system)
        ? [system]
        : []
    if (next.length === 0) return

    const timer = window.setTimeout(() => {
      if (fromLogin) clearLoginNotice()
      // A login notice that already named this menu counts as its announcement.
      if (system && next.includes(system)) announcedRef.current = true
      nextIdRef.current += 1
      const texts: NoticeTexts = {}
      for (const type of next) if (notices[type]) texts[type] = notices[type]
      setNotice({ id: nextIdRef.current, types: next, texts })
    }, OPEN_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [pathname, types, notices, ready, loginPending])

  // Each opening gets a fresh object, so a new notice restarts the clock.
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), NOTICE_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [notice])

  const close = useCallback(() => setNotice(null), [])

  return (
    <MaintenanceNoticeModal
      types={notice?.types ?? null}
      notices={notice?.texts ?? NO_TEXTS}
      sessionId={notice?.id ?? 0}
      durationMs={NOTICE_DURATION_MS}
      onClose={close}
    />
  )
}

export default SystemMaintenanceNotice
