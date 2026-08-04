"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Skeleton, message } from 'antd'
import { AnimatePresence, motion } from 'motion/react'
import { TbBellRinging2, TbX } from 'react-icons/tb'
import {
  useCameraOutageBadge,
  useCameraOutageListInfinite,
  useMarkCameraOutageRead,
} from '@/hooks/queries/manage'
import type { CameraOutageItem } from '@/types/manage/notification-api'
import OutageItem from './OutageItem'

// Camera-outage notification bell (docs/notifications/FRONTEND_NOTIFICATIONS.md §6).
// Badge polls every 60 s (visible tab only); the list is fetched only while
// the panel is open. No realtime push exists for this feed — polling is the
// contract (§0/§5).
//
// The panel deliberately mirrors FindOnPageOverlay's chrome 1:1 (same fixed
// position below the navbar, same glass background / yellow border / glow,
// same spring entrance, ✕ + Escape to close) so the two toolbar popouts read
// as one family.

interface Props {
  /** Icon class from the Navbar so the bell matches its siblings. */
  iconClassName?: string
  /** Controlled mode — the Navbar owns the open state so the bell and the
   *  find-on-page overlay can be made mutually exclusive. Omit both to let
   *  the component manage itself. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const NotificationBell: React.FC<Props> = ({
  iconClassName,
  open: controlledOpen,
  onOpenChange,
}) => {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (onOpenChange) onOpenChange(v)
      else setInternalOpen(v)
    },
    [onOpenChange],
  )
  const [messageApi, msgContextHolder] = message.useMessage()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Badge = meta_data.count of unread+open in 24 h — never res_data.length (§1).
  // On poll failure TanStack keeps the last data, so the badge never blanks.
  const { data: unreadCount = 0 } = useCameraOutageBadge()

  // limit=5 — the panel shows exactly 5 rows, so fetch just one screenful
  // per page; โหลดเพิ่ม/infinite scroll pulls the next 5 as needed.
  const list = useCameraOutageListInfinite({ limit: 5 }, open)
  const items = useMemo(
    () => (list.data?.pages ?? []).flatMap((p) => p.res_data),
    [list.data],
  )

  const markRead = useMarkCameraOutageRead()

  // Facebook-style paging: the first "โหลดเพิ่ม" is an explicit click; from
  // then on `autoLoad` arms an infinite scroll — reaching the bottom of the
  // list fetches the next page by itself, with a small loading row instead
  // of the button. No auto-scrolling on the click — the new rows simply
  // appear below and the user scrolls at their own pace.
  const [autoLoad, setAutoLoad] = useState(false)
  const listScrollRef = useRef<HTMLDivElement>(null)
  const handleLoadMore = () => {
    setAutoLoad(true)
    list.fetchNextPage()
  }
  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!autoLoad || !list.hasNextPage || list.isFetchingNextPage) return
    const el = e.currentTarget
    // 80px early-trigger so the next page is usually ready before the user
    // actually hits the end — the "it just keeps scrolling" feel.
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      list.fetchNextPage()
    }
  }

  // "Show exactly 5 rows": measure a real rendered row instead of guessing a
  // pixel budget — row height shifts with fonts/padding and a hardcoded cap
  // kept clipping the 5th row. Rows are uniform (every line truncates), so
  // the first row is representative.
  const [rowHeight, setRowHeight] = useState<number | null>(null)
  useEffect(() => {
    if (!open || items.length === 0) return
    // rAF: measure after paint (and keeps setState out of the synchronous
    // effect body, per the react-compiler lint rule).
    const raf = requestAnimationFrame(() => {
      const first = listScrollRef.current?.querySelector('button')
      if (first instanceof HTMLElement && first.offsetHeight > 0) {
        const h = first.offsetHeight
        setRowHeight((prev) => (prev === h ? prev : h))
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [open, items.length])

  // Escape closes — same global-while-open listener as the find overlay.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  // Click-away close (a notification panel is expected to dismiss itself;
  // the trigger is excluded so its own click keeps toggling cleanly).
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return
      setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open, setOpen])

  const handleItemClick = (item: CameraOutageItem) => {
    // Optimistic: dot + badge flip in the mutation's onMutate; rollback+toast
    // on failure (§6). Idempotent server-side, so no double-click guard needed.
    if (!item.is_read) {
      markRead.mutate(
        { ids: [item.id] },
        { onError: () => messageApi.error('ทำเครื่องหมายว่าอ่านแล้วไม่สำเร็จ') },
      )
    }
    // Navigate to the maintenance detail page for the camera's install point.
    // Route contract (maintenance/detail/screen): path id + context_id must
    // both be the solution_id or the context is discarded; prefix+dept_id
    // (≥0) resolve the map endpoint; road_id is optional. Cameras without an
    // install point (solution=null, §4) have no page to go to — the click
    // only marks them read.
    if (item.solution?.id) {
      setOpen(false)
      const params = new URLSearchParams({
        context_id: String(item.solution.id),
        prefix: 'cctv',
        dept_id: String(item.department?.id ?? 0),
        // The detail page scrolls its device table to this row on arrival.
        camera_id: item.camera.id,
      })
      if (item.road?.id) params.set('road_id', String(item.road.id))
      router.push(`/admin/maintenance/detail/${item.solution.id}?${params.toString()}`)
    }
  }

  const handleReadAll = () => {
    markRead.mutate(
      { all: true },
      { onError: () => messageApi.error('ทำเครื่องหมายว่าอ่านแล้วไม่สำเร็จ') },
    )
  }

  const renderBody = () => {
    // Error state gets priority over an empty cache — never an empty panel (§6).
    if (list.isError && items.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
          <p className="m-0 fs-14 text-white/70">โหลดไม่สำเร็จ</p>
          <Button size="small" onClick={() => list.refetch()}>ลองใหม่</Button>
        </div>
      )
    }
    if (list.isLoading) {
      return (
        <div className="px-4 py-3 flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} active title paragraph={{ rows: 1 }} />
          ))}
        </div>
      )
    }
    if (items.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10">
          <TbBellRinging2 size={32} className="text-white/25" />
          <p className="m-0 fs-14 text-white/50">ไม่มีแจ้งเตือน</p>
        </div>
      )
    }
    return (
      <>
        <div
          ref={listScrollRef}
          onScroll={handleListScroll}
          className="overflow-y-auto min-h-0"
          // 5 measured rows; once auto-load removes the 40px footer the list
          // absorbs that space so the panel's total height never changes.
          style={{ maxHeight: (rowHeight ? rowHeight * 5 : 565) + (autoLoad ? 40 : 0) }}
        >
          {items.map((item) => (
            <OutageItem key={item.id} item={item} onClick={handleItemClick} />
          ))}
          {autoLoad && list.isFetchingNextPage && (
            <div className="py-2 text-center fs-12 text-white/50">กำลังโหลด…</div>
          )}
        </div>
        {list.hasNextPage && !autoLoad && (
          <div className="h-10 flex items-center justify-center border-0 border-t border-solid border-white/10">
            <Button
              type="text"
              size="small"
              loading={list.isFetchingNextPage}
              onClick={handleLoadMore}
              style={{ color: 'var(--default-blue)' }}
            >
              โหลดเพิ่ม
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {msgContextHolder}
      {/* Trigger mirrors the Navbar's find-on-page button 1:1 — motion scale
          on hover/tap, yellow + pulsing glow while open, hover chip below. */}
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        title="แจ้งเตือนกล้องดับ"
        className={`group relative inline-flex items-center justify-center cursor-pointer transition-colors outline-none focus:outline-none focus-visible:outline-none ${open ? 'text-(--yellow)' : 'text-inherit hover:text-white'}`}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        aria-label={open ? 'ปิดแจ้งเตือน' : 'เปิดแจ้งเตือน'}
        aria-pressed={open}
      >
        <motion.span
          className="flex"
          animate={
            open
              ? {
                filter: [
                  'drop-shadow(0 0 2px rgba(252,209,22,0.7))',
                  'drop-shadow(0 0 8px rgba(252,209,22,1))',
                  'drop-shadow(0 0 2px rgba(252,209,22,0.7))',
                ],
              }
              : { filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))' }
          }
          transition={open ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        >
          {/* Hand-rolled badge — antd Badge's fixed-height pill kept fighting
              the Thai UI font (digits clipped at the top no matter what
              line-height/odometer workaround we threw at it). A plain flex
              pill centers the text deterministically. Cap at 99+ (count can
              be 4 digits after first deploy, §6). */}
          <span className="relative inline-flex">
            <TbBellRinging2
              className={`${iconClassName ?? 'fs-24 cursor-pointer'} ${open ? 'text-(--yellow)' : 'group-hover:text-white'}`}
            />
            {unreadCount > 0 && (
              <span
                className="absolute -top-2 left-full -translate-x-2.5 flex items-center justify-center rounded-full font-bold fs-12 pointer-events-none"
                // App font (IBM Plex Sans Thai) per request. Its vertical
                // metrics float Latin digits above the line-box center
                // (space reserved for Thai below-baseline marks) — the 2px
                // top padding puts them on optical center (eyeballed against
                // the live navbar; don't "simplify" it away).
                style={{
                  background: '#ff4d4f',
                  color: '#fff',
                  lineHeight: 1,
                  height: 18,
                  minWidth: 18,
                  padding: '2px 5px 0',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
        </motion.span>
        <span
          className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
          style={{
            background: 'rgba(0,0,0,0.75)',
            color: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(252,209,22,0.35)',
          }}
        >
          แจ้งเตือน
        </span>
      </motion.button>

      {/* Panel — FindOnPageOverlay's exact chrome, pinned below the navbar. */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed left-2 right-2 sm:left-auto sm:right-4 sm:w-[380px] z-50 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col"
            style={{
              top: 'calc(var(--nav-h, 72px) + 8px)',
              // Viewport clamp only — the "exactly 5 rows" cap lives on the
              // list container below (measured from a real row).
              maxHeight: 'calc(100vh - var(--nav-h, 72px) - 16px)',
              background: 'rgba(20, 20, 20, 0.92)',
              border: '1px solid rgba(252, 209, 22, 0.35)',
              boxShadow:
                '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(252,209,22,0.08), 0 0 22px rgba(252,209,22,0.18)',
            }}
            role="dialog"
            aria-label="แจ้งเตือนกล้องดับ"
          >
            <div className="flex items-center gap-2 pl-4 pr-2 py-2.5 border-0 border-b border-solid border-white/10">
              <TbBellRinging2 className="text-(--yellow) shrink-0" size={18} />
              <span className="fs-16 font-bold text-white">แจ้งเตือน</span>
              <Button
                type="text"
                size="small"
                className="ml-auto"
                disabled={unreadCount === 0 || markRead.isPending}
                onClick={handleReadAll}
                style={{ color: unreadCount === 0 ? undefined : 'var(--default-blue)' }}
              >
                อ่านทั้งหมด
              </Button>
              <div className="h-6 w-px bg-white/15 shrink-0" aria-hidden />
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="ปิด (Esc)"
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-red-500/20 transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="ปิดแจ้งเตือน"
              >
                <TbX size={16} />
              </button>
            </div>
            {renderBody()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default NotificationBell
