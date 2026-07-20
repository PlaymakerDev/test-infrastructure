"use client"
import menu from "@/configs/menu"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TbMenu2,
  TbZoomInArea,
  TbZoomReset,
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarRightCollapse,
  TbSearch,
  TbBellRinging2,
  TbGripHorizontal,
  TbDots,
  // ICON
  TbForms,
  TbBrandDatabricks,
  TbApps,
  TbLayoutDashboard,
  TbHome,
  TbVideo,
  TbCar,
  TbTruckDelivery,
  TbTrafficLights,
  TbWalk,
  TbBolt,
  TbLamp,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbTopologyStar3,
  TbAdjustmentsHorizontal,
  TbBrandGithubCopilot,
  TbCarCrash,
  TbChartColumn,
  TbShieldHalf,
  TbSettings,
  TbCurrentLocation,
  TbLock,
  TbLockOpen,
  TbLogout,
} from "react-icons/tb";
/* SEY DEFAULT YEAR FORMAT */
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import th from 'dayjs/locale/th';
import { useAppDispatch } from "@/stores/hooks";
import { setDrawerOpen } from "@/stores/reducers/layout/layoutSlice";
import useMapFocusMode from "@/utils/hooks/useMapFocusMode";
import { useHomeDeptId, deptQuery } from "@/hooks/queries/manage";
import IconTracking from "@/components/icon/IconTracking";
import IconLPR from "@/components/icon/IconLPR";
import IconAIChat from "@/components/icon/IconAIChat";
import { Button, Dropdown, MenuProps, Modal } from "antd";
import { AnimatePresence, motion } from "motion/react";
import axios, { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import FindOnPageOverlay from "./FindOnPageOverlay";

// Feature systems — link to their overall page scoped to the logged-in user's
// own department (?dept_id=สำนัก/แขวง). The remaining management menus
// (tracking, control-vms, statistic, maintenance) navigate plainly for now.
const DEPT_SCOPED_KEYS = new Set([
  "dashboard",
  "cctv",
  "traffic_signal",
  "incident_detection",
  "crosswalk",
  "traffic_volume",
  "traffic_lighting",
  "vms",
  "bridge_lighting",
  "tunnel",
  "lpr",
]);

/* VARIABLE */
dayjs.extend(buddhistEra);
dayjs().format("BBBB BB");
dayjs.locale(th);

const ICON_LIST: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  TbForms,
  TbBrandDatabricks,
  // ADMIN
  TbLayoutDashboard,
  TbVideo,
  TbCar,
  TbCarCrash,
  TbTruckDelivery,
  TbTrafficLights,
  TbWalk,
  TbBolt,
  TbLamp,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbCurrentLocation,
  TbTopologyStar3,
  TbAdjustmentsHorizontal,
  TbChartColumn,
  TbShieldHalf,
  TbSettings,
  TbBrandGithubCopilot,
}

// The LPR scan-frame glyph (design's text.svg) lives in
// @/components/icon/IconLPR — shared with the map pills/markers so the
// trapezoid menu and every LPR marker use the same glyph 1:1 (same contract
// as IconTracking for the tracking menu).

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const iconClassName = "fs-24 cursor-pointer"
  const dispatch = useAppDispatch()
  // STATE
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'))
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState(false)
  // Lock the trapezoid open — the lock icon at the end toggles this. When
  // locked the menu ignores hover and stays visible. Persists while navigating
  // (layout doesn't remount); resets on a full page reload.
  const [locked, setLocked] = useState(false)
  // Find-on-page overlay (Ctrl+F clone). Owned here because the trigger
  // buttons live in this nav — the overlay itself renders as a portal-like
  // fixed element that visually attaches under the navbar.
  const [findOpen, setFindOpen] = useState(false)
  // Mobile (< lg) replacement for the hover trapezoid: a single trapezoid tab
  // at top-center that pops a grid of the same nav entries. Closes on backdrop
  // tap, tapping the tab again — and on ANY navigation (path or query) without
  // an effect: open state stores the URL it was opened at, so a route/query
  // change derives it closed on the next render.
  const [mobileNavOpenAt, setMobileNavOpenAt] = useState<string | null>(null)
  // Department of the logged-in user — appended to the owned menus' links.
  const homeDeptId = useHomeDeptId()
  // Global "focus the map" toggle — hides every card/panel on overall pages
  // that host a map. Bound to the TbZoomInArea button below.
  // `focusAvailable` comes from live consumer registration (MapFocusGrid /
  // MapOverlayPanel / direct consumers report their mount), so the toggle
  // grays out whenever NOTHING currently on screen would respond — including
  // detail TABS without a map (e.g. incident-detection's รายงานเหตุการณ์),
  // which a route list could never express.
  const { mode: mapFocusMode, isMapFocus, focusAvailable, setMapFocus, setMode: setMapFocusMode, toggle: toggleMapFocus } = useMapFocusMode()
  // MODAL
  const [modal, contextHolder] = Modal.useModal()
  // QUERY CLIENT
  const queryClient = useQueryClient()

  // Reset focus mode on ANY navigation — path OR query (e.g. picking another
  // แขวง from the sidebar keeps the same pathname but swaps ?dept_id). Without
  // the query dep the user lands on the new department with every card still
  // hidden and only the small yellow icon hinting why.
  // Skips the very first run: on initial mount the store already starts with
  // focus OFF, so resetting is a no-op — and because this Navbar mounts inside
  // a Suspense boundary it could otherwise land AFTER a page's own mount
  // effect and clobber an intentional landing state (dashboard's map-only
  // intro turns focus ON on mount and relies on winning the landing frame).
  const searchKey = searchParams.toString()
  const focusResetFirstRunRef = useRef(true)
  useEffect(() => {
    if (focusResetFirstRunRef.current) {
      focusResetFirstRunRef.current = false
      return
    }
    setMapFocus(false)
  }, [pathname, searchKey, setMapFocus])

  // Derived: the popup is open only while still on the URL it was opened at.
  const mobileNavKey = `${pathname}?${searchKey}`
  const mobileNavOpen = mobileNavOpenAt === mobileNavKey
  // Mobile "..." utilities popup — same URL-keyed open state + same grid panel
  // styling as the system-menu popup above, holding what the desktop right-icon
  // row offers (map focus / find / smart search / notifications / settings /
  // logout) with labels, replacing the old 3-icon label-less dropdown.
  const [mobileMoreOpenAt, setMobileMoreOpenAt] = useState<string | null>(null)
  const mobileMoreOpen = mobileMoreOpenAt === mobileNavKey

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Global Ctrl+F / Cmd+F — hijack the browser's native find-in-page and
  // route it to our in-app overlay instead. Users who explicitly want the
  // browser's search can still use it via the menu or Ctrl+G on Firefox.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setFindOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onLogout = useCallback(async () => {
    try {
      const response = await axios.post(`${process.env.__NEXT_ROUTER_BASEPATH ?? ''}/api/auth/logout`, {})
      if (response.status === 200) {
        // Drop this user's cached (token-scoped) data so the next login starts clean.
        queryClient.clear()

        modal.success({
          title: 'Logout successful',
          content: 'You have been logged out successfully.',
          onOk: () => router.push('/auth/login'),
          onCancel: () => Modal.destroyAll(),
        })
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        modal.error({
          title: 'Logout failed',
          content: error.response?.data?.res_data?.message,
          onOk: () => Modal.destroyAll(),
          onCancel: () => Modal.destroyAll(),
        })
      }
    }
  }, [modal, router, queryClient])

  // Entries for the mobile "..." grid panel — everything the desktop
  // right-icon row offers, now with visible labels (the old label-less
  // 3-icon dropdown hid what each glyph meant and was missing Smart Search /
  // settings / logout entirely).
  const moreEntries = [
    {
      key: 'map-focus',
      label: isMapFocus ? 'ปิดเน้นแผนที่' : 'เน้นแผนที่',
      icon: isMapFocus
        ? <TbZoomReset size={22} />
        : <TbZoomInArea size={22} />,
      disabled: !focusAvailable,
      active: isMapFocus,
      title: !focusAvailable ? 'หน้านี้ไม่มีแผนที่ให้เน้น' : undefined,
      // Close the panel so the focus result is immediately visible — keeping
      // it open left the backdrop over a layout that just changed underneath.
      onClick: () => {
        setMobileMoreOpenAt(null)
        toggleMapFocus()
      },
    },
    {
      key: 'find',
      label: 'ค้นหาในหน้า',
      icon: <TbSearch size={22} />,
      active: findOpen,
      onClick: () => {
        setMobileMoreOpenAt(null)
        setFindOpen(true)
      },
    },
    {
      key: 'smart-search',
      label: 'Smart Search',
      icon: <IconAIChat size={22} />,
      active: !!pathname?.startsWith('/admin/smart-search'),
      onClick: () => {
        setMobileMoreOpenAt(null)
        router.push('/admin/smart-search')
      },
    },
    {
      key: 'notifications',
      label: 'แจ้งเตือน',
      icon: <TbBellRinging2 size={22} />,
      active: false,
      // No behavior yet — mirrors the desktop bell placeholder.
      onClick: () => setMobileMoreOpenAt(null),
    },
    {
      key: 'settings',
      label: 'ระบบและการตั้งค่า',
      icon: <TbSettings size={22} />,
      active: !!pathname?.startsWith('/admin/settings'),
      onClick: () => {
        setMobileMoreOpenAt(null)
        router.push('/admin/settings')
      },
    },
    {
      key: 'logout',
      label: 'ออกจากระบบ',
      icon: <TbLogout size={22} />,
      active: false,
      onClick: () => {
        setMobileMoreOpenAt(null)
        onLogout()
      },
    },
  ]

  const extraItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'ระบบและการตั้งค่า',
      icon: <TbSettings />,
      onClick: () => router.push("/admin/settings"),
    },
    {
      key: '2',
      label: 'ออกจากระบบ',
      icon: <TbLogout />,
      onClick: () => onLogout(),

    }
  ]

  // Fallback to a location icon for menu items without one (e.g. Tracking,
  // whose icon is empty in the shared admin menu — left untouched here).
  const Icon = useCallback(
    (iconName: string, props: { size?: number; className?: string }) => {
      const IconComponent = ICON_LIST[iconName] ?? TbCurrentLocation
      return <IconComponent {...props} />
    },
    []
  )

  // Trapezoid = shared admin menu minus Settings/Smart Search. The LPR menu
  // (formerly a design-only placeholder) is a real admin.ts entry now, ordered
  // right after Tracking in the config itself.
  const navItems = useMemo(
    () =>
      menu["ADMIN"].filter(
        (m) => m.label_key !== "settings" && m.label_key !== "smart_search"
      ),
    []
  )

  // Enriched entries shared by the desktop trapezoid AND the mobile popup
  // grid, so both always agree on icon overrides, active state, and hrefs.
  // Dashboard → house icon; Tracking / LPR → shared design glyphs (the same
  // components the map markers/pills use); everything else uses its admin.ts
  // icon. (Navbar-only overrides — admin.ts stays icon-string.)
  // Owned menus land on the user's own department; others navigate plainly.
  // dept 0 (ส่วนกลาง) adds scope=all so the overall page shows every bureau.
  const navEntries = useMemo(
    () =>
      navItems.map((item) => {
        const OverrideIcon =
          item.label_key === "dashboard"
            ? TbHome
            : item.label_key === "tracking"
              ? IconTracking
              : item.label_key === "lpr"
                ? IconLPR
                : undefined
        const href = DEPT_SCOPED_KEYS.has(item.label_key)
          ? `${item.path}?${deptQuery(homeDeptId)}`
          : item.path
        return { ...item, OverrideIcon, href, active: pathname === item.path_active }
      }),
    [navItems, pathname, homeDeptId]
  )

  const renderTrapezoidNav = useMemo(() => {
    return navEntries.map((item) => {
      const { OverrideIcon, active } = item
      return (
        <button
          key={item.key}
          onClick={() => router.push(item.href)}
          className={`relative flex flex-col items-center justify-center gap-0.5 px-1.5 lg:px-2 h-full transition-colors shrink-0 cursor-pointer ${active ? "text-(--yellow)" : "text-white/70 hover:text-white"
            }`}
          title={item.title}
        >
          <span>{OverrideIcon ? <OverrideIcon size={24} /> : Icon(item.icon, { size: 24 })}</span>
          {active && (
            <span className="hidden lg:block text-[13px] font-medium text-(--yellow)">
              {item.label}
            </span>
          )}
        </button>
      )
    })
  }, [navEntries, router, Icon])

  return (
    <nav className={`navbar ${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-main-menu">
          <TbMenu2
            className={`${iconClassName}`}
            onClick={() => dispatch(setDrawerOpen({ open: true }))}
          />
          <div>
            <p className="fs-12" suppressHydrationWarning>{currentTime}</p>
            <p className="fs-12" suppressHydrationWarning>{dayjs().format('DD MMMM BBBB')}</p>
          </div>
        </div>
        {/* CENTER — trapezoid nav (from phu2 backup): flush to top, 72px tall
            (= navbar height --nav-h), 900px wide centered, absolutely
            positioned so it never affects the left/right sections. */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 z-20 hidden lg:block"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            className={`relative flex items-center justify-center gap-0.5 lg:gap-1 px-8 lg:px-10 transition-all duration-300 ${hovered || locked
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2"
              }`}
            style={{ height: 72, width: "fit-content", maxWidth: "90vw" }}
          >
            {/* Background shape — trapezoid (height scaled to 60) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 810 60"
              preserveAspectRatio="none"
              style={{ filter: "drop-shadow(0px 2px 15px rgba(252, 209, 22, 0.6))" }}
            >
              <path
                d="M0,0 L810,0 L790,52.5 Q787,60 780,60 L30,60 Q23,60 20,52.5 L0,0Z"
                fill="#000000E6"
                stroke="rgba(252,209,22,0.3)"
                strokeWidth="1"
              />
            </svg>
            {renderTrapezoidNav}
            {/* Lock toggle (last item) — pins the menu open so it no longer
              * auto-hides on mouse-leave; click again to return to hover mode.
              * Sits inline with the menu icons (no frame/chip, so it stays
              * inside the trapezoid); hover grows / tap presses, the icon
              * springs+rotates on toggle, and while locked the icon ITSELF
              * breathes a yellow glow (drop-shadow) — no background circle. */}
            <motion.button
              type="button"
              onClick={() => setLocked((v) => !v)}
              title={locked ? "ปลดล็อก (ซ่อนเมนูอัตโนมัติ)" : "ล็อกเมนูให้แสดงตลอด"}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-1.5 lg:px-2 h-full shrink-0 cursor-pointer ${locked ? "text-(--yellow)" : "text-white/70 hover:text-white"
                }`}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.span
                key={locked ? "locked" : "unlocked"}
                className="flex"
                initial={{ rotate: -35, scale: 0.5, opacity: 0 }}
                animate={
                  locked
                    ? {
                      rotate: 0,
                      scale: 1,
                      opacity: 1,
                      filter: [
                        "drop-shadow(0 0 2px rgba(252,209,22,0.7))",
                        "drop-shadow(0 0 7px rgba(252,209,22,1))",
                        "drop-shadow(0 0 2px rgba(252,209,22,0.7))",
                      ],
                    }
                    : { rotate: 0, scale: 1, opacity: 1, filter: "drop-shadow(0 0 0 rgba(0,0,0,0))" }
                }
                transition={{
                  rotate: { type: "spring", stiffness: 420, damping: 18 },
                  scale: { type: "spring", stiffness: 420, damping: 18 },
                  opacity: { duration: 0.2 },
                  ...(locked ? { filter: { duration: 2, repeat: Infinity, ease: "easeInOut" } } : {}),
                }}
              >
                {locked ? <TbLock size={20} /> : <TbLockOpen size={20} />}
              </motion.span>
            </motion.button>
          </div>
        </div>
        {/* MOBILE (< lg) system-menu popup — trigger button lives in
            .mobile-side-menu below (beside the ... button; a centered tab
            covered page text like the map-hint chip). Kept in an untransformed
            wrapper: a CSS transform on an ancestor would re-anchor the `fixed`
            backdrop to that ancestor instead of the viewport. */}
        <div className="lg:hidden">
          <AnimatePresence>
            {/* Backdrop — dims the page; tap anywhere outside to close. Both
                children sit DIRECTLY under AnimatePresence as keyed motion
                components (fragments/plain wrappers break exit tracking). */}
            {mobileNavOpen && (
              <motion.div
                key="mobile-nav-backdrop"
                className="fixed inset-0 z-10"
                style={{ background: 'rgba(0, 0, 0, 0.45)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setMobileNavOpenAt(null)}
              />
            )}
            {/* Popup grid — 3 columns, same entries/order as desktop. The
                centering -50% lives in motion's x (constant across states)
                because motion owns the transform and would overwrite a
                Tailwind -translate-x-1/2. */}
            {mobileNavOpen && (
              <motion.div
                key="mobile-nav-panel"
                className="absolute left-1/2 z-20 rounded-2xl overflow-hidden"
                style={{
                  top: 'calc(100% + 10px)',
                  width: 'min(92vw, 400px)',
                  background: '#000000E6',
                  border: '1px solid rgba(252,209,22,0.3)',
                  boxShadow: '0px 2px 15px rgba(252, 209, 22, 0.45)',
                }}
                initial={{ opacity: 0, y: -12, scale: 0.96, x: '-50%' }}
                animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                exit={{ opacity: 0, y: -12, scale: 0.96, x: '-50%' }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="grid grid-cols-3 py-1">
                  {navEntries.map((item) => {
                    const { OverrideIcon, active } = item
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setMobileNavOpenAt(null)
                          router.push(item.href)
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 cursor-pointer transition-colors ${active ? 'text-(--yellow)' : 'text-white/75 active:text-white'}`}
                        title={item.title}
                      >
                        <span>{OverrideIcon ? <OverrideIcon size={22} /> : Icon(item.icon, { size: 22 })}</span>
                        <span className={`text-[11px] leading-tight text-center ${active ? 'font-semibold' : ''}`}>
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
            {/* "..." utilities popup — same backdrop/panel treatment as the
                system menu above; entries carry labels so each glyph is
                self-explanatory (the old dropdown was icon-only). */}
            {mobileMoreOpen && (
              <motion.div
                key="mobile-more-backdrop"
                className="fixed inset-0 z-10"
                style={{ background: 'rgba(0, 0, 0, 0.45)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setMobileMoreOpenAt(null)}
              />
            )}
            {mobileMoreOpen && (
              <motion.div
                key="mobile-more-panel"
                className="absolute left-1/2 z-20 rounded-2xl overflow-hidden"
                style={{
                  top: 'calc(100% + 10px)',
                  width: 'min(92vw, 400px)',
                  background: '#000000E6',
                  border: '1px solid rgba(252,209,22,0.3)',
                  boxShadow: '0px 2px 15px rgba(252, 209, 22, 0.45)',
                }}
                initial={{ opacity: 0, y: -12, scale: 0.96, x: '-50%' }}
                animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                exit={{ opacity: 0, y: -12, scale: 0.96, x: '-50%' }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="grid grid-cols-3 py-1">
                  {moreEntries.map((item) => (
                    <button
                      key={item.key}
                      disabled={item.disabled}
                      onClick={item.disabled ? undefined : item.onClick}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 transition-colors ${item.disabled
                        ? 'opacity-40 cursor-not-allowed text-white/75'
                        : item.active
                          ? 'text-(--yellow) cursor-pointer'
                          : 'text-white/75 active:text-white cursor-pointer'
                        }`}
                      title={item.title}
                    >
                      <span>{item.icon}</span>
                      <span className={`text-[11px] leading-tight text-center ${item.active ? 'font-semibold' : ''}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="nav-side-menu">
          {/* Focus-mode picker — the old single-button (off ↔ both) is now a
            * dropdown with 4 modes so users can hide LEFT / RIGHT / BOTH.
            * Left-click opens the menu; keyboard/`aria-pressed` still track
            * whether ANY side is currently hidden. */}
          <Dropdown
            trigger={focusAvailable ? ['click'] : []}
            disabled={!focusAvailable}
            menu={{
              selectedKeys: [mapFocusMode],
              items: [
                { key: 'off',   label: 'แสดงทั้งหมด',       icon: <TbZoomReset size={16} /> },
                { key: 'left',  label: 'ซ่อนแผงฝั่งซ้าย',   icon: <TbLayoutSidebarLeftCollapse size={16} /> },
                { key: 'right', label: 'ซ่อนแผงฝั่งขวา',    icon: <TbLayoutSidebarRightCollapse size={16} /> },
                { key: 'both',  label: 'ซ่อนทั้งสองฝั่ง',   icon: <TbZoomInArea size={16} /> },
              ],
              onClick: ({ key }) =>
                setMapFocusMode(key as 'off' | 'left' | 'right' | 'both'),
            }}
            placement="bottomRight"
          >
            <button
              type="button"
              disabled={!focusAvailable}
              className={`inline-flex items-center justify-center transition-colors ${!focusAvailable
                ? 'text-white/25 cursor-not-allowed'
                : isMapFocus
                  ? 'text-(--yellow) cursor-pointer'
                  : 'text-inherit hover:text-white cursor-pointer'}`}
              aria-label={isMapFocus ? 'Exit map focus mode' : 'Enter map focus mode'}
              aria-pressed={isMapFocus}
              aria-disabled={!focusAvailable}
              title={!focusAvailable
                ? 'หน้านี้ไม่มีแผนที่ให้เน้น'
                : mapFocusMode === 'left'
                  ? 'ซ่อนฝั่งซ้าย — คลิกเพื่อเปลี่ยน'
                  : mapFocusMode === 'right'
                    ? 'ซ่อนฝั่งขวา — คลิกเพื่อเปลี่ยน'
                    : mapFocusMode === 'both'
                      ? 'ซ่อนทั้งสองฝั่ง — คลิกเพื่อเปลี่ยน'
                      : 'เน้นแผนที่ (คลิกเพื่อเลือกฝั่งที่จะซ่อน)'}
            >
              {mapFocusMode === 'left'
                ? <TbLayoutSidebarLeftCollapse className="fs-24" />
                : mapFocusMode === 'right'
                  ? <TbLayoutSidebarRightCollapse className="fs-24" />
                  : mapFocusMode === 'both'
                    ? <TbZoomReset className="fs-24" />
                    : <TbZoomInArea className="fs-24" />}
            </button>
          </Dropdown>
          {/* Find-on-page trigger — mirrors the Ctrl+F affordance so the
              icon *is* the shortcut. Open state paints the icon yellow with
              a breathing glow; the small "Ctrl+F" chip below only appears on
              hover so it doesn't fight the tighter icons for space. */}
          <motion.button
            type="button"
            onClick={() => setFindOpen((v) => !v)}
            title="ค้นหาในหน้า (Ctrl+F)"
            className={`group relative inline-flex items-center justify-center cursor-pointer transition-colors ${findOpen ? 'text-(--yellow)' : 'text-inherit hover:text-white'}`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            aria-label={findOpen ? 'ปิดค้นหาในหน้า' : 'เปิดค้นหาในหน้า'}
            aria-pressed={findOpen}
          >
            <motion.span
              className="flex"
              animate={
                findOpen
                  ? {
                    filter: [
                      'drop-shadow(0 0 2px rgba(252,209,22,0.7))',
                      'drop-shadow(0 0 8px rgba(252,209,22,1))',
                      'drop-shadow(0 0 2px rgba(252,209,22,0.7))',
                    ],
                  }
                  : { filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))' }
              }
              transition={findOpen ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
            >
              <TbSearch className={iconClassName} />
            </motion.span>
            {/* Hover chip — Ctrl+F hint. Positioned below so it never clips
                the trapezoid above. */}
            <span
              className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums whitespace-nowrap"
              style={{
                background: 'rgba(0,0,0,0.75)',
                color: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(252,209,22,0.35)',
              }}
            >
              Ctrl + F
            </span>
          </motion.button>
          {/* Smart Search — AI-chat glyph (Hugeicons ai-chat-01 via IconAIChat);
            * active = yellow, same as every other menu icon. */}
          <IconAIChat
            className={`${iconClassName} ${pathname?.startsWith("/admin/smart-search") ? "text-(--yellow)" : ""}`}
            onClick={() => router.push("/admin/smart-search")}
          />
          <TbBellRinging2
            className={iconClassName}
          />
          <Dropdown
            menu={{ items: extraItems }}
            trigger={["click"]}
            placement="bottom"
          >
            <TbGripHorizontal
              className={iconClassName}
            />
          </Dropdown>
        </div>
        <div className="mobile-side-menu">
          {/* Inner flex wrapper — layout.css forces .mobile-side-menu itself
              to `display: block` (unlayered, beats Tailwind utilities), so
              the gap must live one level down. */}
          <div className="flex items-center gap-4">
            {/* System-menu trigger — pops the nav grid (same entries as the
                desktop trapezoid). Sits beside the ... button instead of a
                centered tab so it never covers page text under the navbar. */}
            <Button
              shape="circle"
              aria-label={mobileNavOpen ? 'ปิดเมนูระบบ' : 'เปิดเมนูระบบ'}
              aria-expanded={mobileNavOpen}
              onClick={() => {
                setMobileMoreOpenAt(null) // one popup at a time
                setMobileNavOpenAt(mobileNavOpen ? null : mobileNavKey)
              }}
              style={
                mobileNavOpen
                  ? { color: 'var(--yellow)', borderColor: 'rgba(252,209,22,0.6)' }
                  : undefined
              }
              icon={<TbApps />}
            />
            {/* "..." utilities — pops the labeled grid panel (same look as the
                system menu); replaces the old icon-only antd Dropdown. */}
            <Button
              shape="circle"
              aria-label={mobileMoreOpen ? 'ปิดเมนูเพิ่มเติม' : 'เปิดเมนูเพิ่มเติม'}
              aria-expanded={mobileMoreOpen}
              onClick={() => {
                setMobileNavOpenAt(null) // one popup at a time
                setMobileMoreOpenAt(mobileMoreOpen ? null : mobileNavKey)
              }}
              style={
                mobileMoreOpen
                  ? { color: 'var(--yellow)', borderColor: 'rgba(252,209,22,0.6)' }
                  : undefined
              }
              icon={<TbDots />}
            />
          </div>
        </div>
      </div>
      <FindOnPageOverlay open={findOpen} onClose={() => setFindOpen(false)} />
      {contextHolder}
    </nav>
  )
}