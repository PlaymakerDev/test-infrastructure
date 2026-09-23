"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button, Skeleton, message } from 'antd'
import { AnimatePresence, motion } from 'motion/react'
import { TbBellRinging2, TbX } from 'react-icons/tb'
import {
  useMarkNotificationFeedRead,
  useNotificationFeedBadges,
  useNotificationFeedInfinite,
} from '@/hooks/queries/manage'
import type {
  NotificationFeedItem,
  NotificationFeedKind,
} from '@/types/manage/notification-api'
import { useUserKind } from '@/utils/hooks/useUserKind'
import FeedItem from './FeedItem'

// Notification bell — camera outages AND maintenance cases in one list, per
// src/features/admin/maintenance/FRONTEND_NOTIFICATION_FEED.md. Badge polls
// every 60 s (visible tab only); the list is fetched only while the panel is
// open. There is no realtime push — polling is the contract (§9.8).
//
// The panel deliberately mirrors FindOnPageOverlay's chrome 1:1 (same fixed
// position below the navbar, same glass background / yellow border / glow,
// same spring entrance, ✕ + Escape to close) so the two toolbar popouts read
// as one family.

type FeedTab = NotificationFeedKind | 'all'

/** Open camera outages outnumber open cases roughly 20:1 for a full-scope
 *  admin (795 vs 40 over a week, measured on prod), so without tabs the case
 *  notifications the feed was built for would be unfindable.
 *
 *  Order is priority, and แจ้งซ่อม is also where the panel opens (user
 *  2026-09-23): a case is work someone has to act on, a dead camera usually
 *  becomes a case anyway. ทั้งหมด goes last — it's the view you reach for
 *  least. */
const KIND_TABS: Array<{ key: FeedTab; label: string }> = [
  { key: 'case', label: 'แจ้งซ่อม' },
  { key: 'camera_outage', label: 'กล้องดับ' },
  { key: 'all', label: 'ทั้งหมด' },
]
const DEFAULT_TAB: FeedTab = 'case'

const EMPTY_TEXT: Record<FeedTab, string> = {
  case: 'ไม่มีแจ้งซ่อมค้าง',
  camera_outage: 'ไม่มีกล้องดับค้าง',
  all: 'ไม่มีแจ้งเตือน',
}

/** "99+" past two digits — the bell and the tabs cap alike. */
const capCount = (n: number) => (n > 99 ? '99+' : String(n))

/** One count pill on the bell. App font (IBM Plex Sans Thai) floats Latin
 *  digits above the line-box centre (it reserves room for Thai below-baseline
 *  marks) — the 2px top padding puts them on optical centre. Eyeballed against
 *  the live navbar; don't "simplify" it away. */
const BellCount: React.FC<{ value: number; background: string; color: string }> = ({
  value,
  background,
  color,
}) => (
  <span
    className="flex items-center justify-center rounded-full font-bold"
    style={{
      background,
      color,
      fontSize: 11,
      lineHeight: 1,
      height: 16,
      minWidth: 16,
      padding: '2px 4px 0',
      // A 1px ring in the navbar colour separates the two stacked pills and
      // keeps each readable where it overlaps the bell glyph.
      boxShadow: '0 0 0 1.5px #191919',
    }}
  >
    {capCount(value)}
  </span>
)

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

  // Unread + still-open counts, split by kind — each comes from its own
  // meta_data.count, never res_data.length (§3). On a failed poll TanStack
  // keeps the last data, so neither number blanks out.
  const { caseCount, outageCount } = useNotificationFeedBadges()
  const unreadFor: Record<FeedTab, number> = {
    case: caseCount,
    camera_outage: outageCount,
    all: caseCount + outageCount,
  }

  // role `user` may READ case notifications but gets 403 on the case detail
  // endpoint, so those rows must never navigate (§6).
  const { userKind } = useUserKind()
  const caseIsReachable = userKind !== 'user'

  const [kind, setKind] = useState<FeedTab>(DEFAULT_TAB)

  // limit=5 — the panel shows exactly 5 rows, so fetch just one screenful
  // per page; โหลดเพิ่ม/infinite scroll pulls the next 5 as needed.
  const list = useNotificationFeedInfinite(
    { limit: 5, ...(kind === 'all' ? {} : { kind }) },
    open,
  )
  const items = useMemo(
    () => (list.data?.pages ?? []).flatMap((p) => p.res_data),
    [list.data],
  )

  const markRead = useMarkNotificationFeedRead()

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

  /** Where a row leads, or null when it leads nowhere — a case a `user` may
   *  not open, or an item with no install point to land on. Rows with no
   *  target are still clickable to mark read, they just don't navigate. */
  const targetFor = React.useCallback(
    (item: NotificationFeedItem): string | null => {
      const params = new URLSearchParams({
        prefix: 'cctv',
        dept_id: String(item.department?.id ?? 0),
      })
      if (item.road?.id) params.set('road_id', String(item.road.id))

      if (item.kind === 'case') {
        if (!caseIsReachable) return null
        // The case page keys off case_no (it renders the value as "Case No.")
        // — NOT the feed's uuid, even though the API accepts both.
        if (item.solution?.id) {
          params.set('context_id', String(item.solution.id))
          params.set('solution_id', String(item.solution.id))
        }
        return `/admin/maintenance/case/${encodeURIComponent(item.case.case_no)}?${params.toString()}`
      }

      // Route contract (maintenance/detail/screen): path id + context_id must
      // both be the solution_id or the context is discarded. Cameras without
      // an install point have no page to go to.
      if (!item.solution?.id) return null
      params.set('context_id', String(item.solution.id))
      // The detail page scrolls its device table to this row on arrival.
      params.set('camera_id', item.camera.id)
      return `/admin/maintenance/detail/${item.solution.id}?${params.toString()}`
    },
    [caseIsReachable],
  )

  const handleItemClick = (item: NotificationFeedItem) => {
    // Optimistic: dot + badge flip in the mutation's onMutate; rollback+toast
    // on failure. Idempotent server-side, so no double-click guard needed —
    // and `marked: 0` is a normal answer, never an error (§4).
    if (!item.is_read) {
      markRead.mutate(
        { items: [{ kind: item.kind, id: item.id }] },
        { onError: () => messageApi.error('ทำเครื่องหมายว่าอ่านแล้วไม่สำเร็จ') },
      )
    }
    const href = targetFor(item)
    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  const handleReadAll = () => {
    // Scoped to the tab in view: on แจ้งซ่อม/กล้องดับ "อ่านทั้งหมด" should not
    // silently clear the kind the user isn't looking at.
    markRead.mutate(
      kind === 'all' ? { all: true } : { all: true, kind },
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
          <p className="m-0 fs-14 text-white/50">{EMPTY_TEXT[kind]}</p>
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
            // kind + id: the two kinds have independent id spaces.
            <FeedItem
              key={`${item.kind}:${item.id}`}
              item={item}
              clickable={targetFor(item) !== null}
              onClick={handleItemClick}
            />
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
        // The two numbers are colour-coded; the tooltip spells them out.
        title={`แจ้งซ่อม ${caseCount} เคส · กล้องดับ ${outageCount} ตัว`}
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
          {/* Two hand-rolled counts stacked beside the bell — cases on top
              (yellow, the wrench colour in the list), dead cameras under it
              (red, the กำลังดับ colour). One combined "99+" hid whether any
              case was waiting at all (user 2026-09-23). Stacked rather than
              side by side so the pair fits the 20px gap to the next navbar
              icon. antd Badge isn't used: its fixed-height pill clips the
              Thai UI font's digits no matter the line-height. */}
          <span className="relative inline-flex">
            <TbBellRinging2
              className={`${iconClassName ?? 'fs-24 cursor-pointer'} ${open ? 'text-(--yellow)' : 'group-hover:text-white'}`}
            />
            {(caseCount > 0 || outageCount > 0) && (
              <span className="absolute -top-2 left-full -translate-x-2.5 flex flex-col items-start gap-0.5 pointer-events-none">
                {caseCount > 0 && (
                  <BellCount value={caseCount} background="var(--yellow)" color="#191919" />
                )}
                {outageCount > 0 && (
                  <BellCount value={outageCount} background="#ff4d4f" color="#fff" />
                )}
              </span>
            )}
          </span>
        </motion.span>
      </motion.button>

      {/* Panel — FindOnPageOverlay's exact chrome, pinned below the navbar.
          Portalled to <body> so it survives its own ancestor being hidden:
          the trigger sits in .nav-side-menu, which layout.css sets to
          display:none under 900px, and that would take the (already
          position:fixed) panel down with it. `--nav-h` lives on :root, so
          the offsets resolve the same from body. */}
      {typeof document !== 'undefined' && createPortal(
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
              top: 'calc(var(--nav-h, 72px) - 12px)', // 60px — shared popout line
              // Viewport clamp only — the "exactly 5 rows" cap lives on the
              // list container below (measured from a real row).
              maxHeight: 'calc(100vh - var(--nav-h, 72px) + 4px)',
              background: 'rgba(20, 20, 20, 0.92)',
              border: '1px solid rgba(252, 209, 22, 0.35)',
              boxShadow:
                '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(252,209,22,0.08), 0 0 22px rgba(252,209,22,0.18)',
            }}
            role="dialog"
            aria-label="แจ้งเตือน"
          >
            <div className="flex items-center gap-2 pl-4 pr-2 py-2.5 border-0 border-b border-solid border-white/10">
              <TbBellRinging2 className="text-(--yellow) shrink-0" size={18} />
              <span className="fs-16 font-bold text-white">แจ้งเตือน</span>
              <Button
                type="text"
                size="small"
                className="ml-auto"
                disabled={unreadFor[kind] === 0 || markRead.isPending}
                onClick={handleReadAll}
                style={{ color: unreadFor[kind] === 0 ? undefined : 'var(--default-blue)' }}
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
            <div
              className="flex items-center gap-1.5 px-4 py-2 border-0 border-b border-solid border-white/10"
              role="tablist"
              aria-label="กรองชนิดแจ้งเตือน"
            >
              {KIND_TABS.map((tab) => {
                const active = kind === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    // Switching filters starts a fresh list, so the
                    // Facebook-style auto-scroll arms again from scratch.
                    onClick={() => { setKind(tab.key); setAutoLoad(false) }}
                    className={`px-3 py-1 rounded-full fs-12 cursor-pointer border border-solid transition-colors ${active
                      ? 'border-(--yellow) text-(--yellow) bg-[rgba(252,209,22,0.12)]'
                      : 'border-white/15 text-white/60 bg-transparent hover:text-white hover:border-white/35'
                      }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {tab.label}
                      {/* Same colours as the bell's own pills, so the two
                          numbers up there are explained the moment the panel
                          opens. ทั้งหมด stays unlabelled — it's their sum. */}
                      {tab.key !== 'all' && unreadFor[tab.key] > 0 && (
                        <span
                          className="inline-flex items-center justify-center rounded-full font-bold"
                          style={{
                            background: tab.key === 'case' ? 'var(--yellow)' : '#ff4d4f',
                            color: tab.key === 'case' ? '#191919' : '#fff',
                            fontSize: 11,
                            lineHeight: 1,
                            height: 16,
                            minWidth: 16,
                            padding: '2px 4px 0',
                          }}
                        >
                          {capCount(unreadFor[tab.key])}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            {renderBody()}
          </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

export default NotificationBell
