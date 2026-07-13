"use client"
import menu from "@/configs/menu"
import type { AdminMenuItem } from "@/configs/menu/admin"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TbMenu2,
  TbZoomInArea,
  TbZoomReset,
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
import { Button, Dropdown, MenuProps, Modal } from "antd";
import { motion } from "motion/react";
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

// Design SVG icon (text.svg) — inline so it inherits currentColor (turns yellow
// when active) and takes a size prop like react-icons. Tracking icon comes from
// @/components/icon/IconTracking so the trapezoid and every map's WIM markers
// share the same glyph 1:1.
const IconText: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.75 15H21.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 10H16.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.25 20H17.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.75 8.75V6.25C3.75 5.58696 4.01339 4.95107 4.48223 4.48223C4.95107 4.01339 5.58696 3.75 6.25 3.75H8.75" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.75 21.25V23.75C3.75 24.413 4.01339 25.0489 4.48223 25.5178C4.95107 25.9866 5.58696 26.25 6.25 26.25H8.75" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21.25 3.75H23.75C24.413 3.75 25.0489 4.01339 25.5178 4.48223C25.9866 4.95107 26.25 5.58696 26.25 6.25V8.75" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21.25 26.25H23.75C24.413 26.25 25.0489 25.9866 25.5178 25.5178C25.9866 25.0489 26.25 24.413 26.25 23.75V21.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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
  // Department of the logged-in user — appended to the owned menus' links.
  const homeDeptId = useHomeDeptId()
  // Global "focus the map" toggle — hides every card/panel on overall pages
  // that host a map. Bound to the TbZoomInArea button below.
  const { isMapFocus, setMapFocus, toggle: toggleMapFocus } = useMapFocusMode()
  // MODAL
  const [modal, contextHolder] = Modal.useModal()
  // QUERY CLIENT
  const queryClient = useQueryClient()

  // Reset focus mode on ANY navigation — path OR query (e.g. picking another
  // แขวง from the sidebar keeps the same pathname but swaps ?dept_id). Without
  // the query dep the user lands on the new department with every card still
  // hidden and only the small yellow icon hinting why.
  const searchKey = searchParams.toString()
  useEffect(() => {
    setMapFocus(false)
  }, [pathname, searchKey, setMapFocus])

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
      const response = await axios.post('/api/auth/logout', {})
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

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <span
          role="button"
          tabIndex={0}
          onClick={toggleMapFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleMapFocus()
            }
          }}
          className={`inline-flex ${isMapFocus ? 'text-(--yellow)' : ''}`}
          aria-label={isMapFocus ? 'Exit map focus mode' : 'Enter map focus mode'}
          aria-pressed={isMapFocus}
          title={isMapFocus ? 'ปิดโหมดเน้นแผนที่' : 'เน้นแผนที่ (ซ่อนการ์ด/แผงด้านข้าง)'}
        >
          {isMapFocus
            ? <TbZoomReset className={iconClassName} />
            : <TbZoomInArea className={iconClassName} />}
        </span>
      ),
    },
    {
      key: '2',
      label: (
        <span
          role="button"
          tabIndex={0}
          onClick={() => setFindOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setFindOpen(true)
            }
          }}
          className={`inline-flex ${findOpen ? 'text-(--yellow)' : ''}`}
          aria-label="เปิดค้นหาในหน้า"
        >
          <TbSearch className={iconClassName} />
        </span>
      ),
    },
    {
      key: '3',
      label: <TbBellRinging2 className={iconClassName} />
    },
    // {
    //   key: '4',
    //   label: <TbGripHorizontal className={iconClassName} />
    // },
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

  // Trapezoid = shared admin menu minus Settings/Smart Search, PLUS a design-only
  // placeholder icon (text.svg) inserted right after Tracking that has no menu
  // data yet. admin.ts and the sidebar are left untouched.
  const navItems = useMemo(() => {
    const menuItems = menu["ADMIN"].filter(
      (m) => m.label_key !== "settings" && m.label_key !== "smart_search"
    )
    const out: Array<
      | { kind: "menu"; item: AdminMenuItem }
      | { kind: "placeholder"; key: string }
    > = []
    for (const item of menuItems) {
      out.push({ kind: "menu", item })
      if (item.label_key === "tracking") {
        out.push({ kind: "placeholder", key: "text-placeholder" })
      }
    }
    return out
  }, [])

  const renderTrapezoidNav = useMemo(() => {
    return navItems.map((node) => {
      // Design placeholder (text.svg) — icon only, no route/label yet.
      if (node.kind === "placeholder") {
        return (
          <button
            key={node.key}
            type="button"
            title="(ยังไม่มีเมนู)"
            className="relative flex flex-col items-center justify-center gap-0.5 px-1.5 lg:px-2 h-full text-white/70 hover:text-white shrink-0 cursor-default"
          >
            <span>
              <IconText size={24} />
            </span>
          </button>
        )
      }
      const item = node.item
      const active = pathname === item.path_active
      // Dashboard → house icon; Tracking → the design SVG; everything else
      // uses its admin.ts icon. (Navbar-only overrides — admin.ts untouched.)
      const OverrideIcon =
        item.label_key === "dashboard"
          ? TbHome
          : item.label_key === "tracking"
            ? IconTracking
            : undefined
      // Owned menus land on the user's own department; others navigate plainly.
      // dept 0 (ส่วนกลาง) adds scope=all so the overall page shows every bureau.
      const href = DEPT_SCOPED_KEYS.has(item.label_key)
        ? `${item.path}?${deptQuery(homeDeptId)}`
        : item.path
      return (
        <button
          key={item.key}
          onClick={() => router.push(href)}
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
  }, [navItems, pathname, router, Icon, homeDeptId])

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
            className={`relative flex items-center justify-center gap-0.5 lg:gap-1 px-4 lg:px-6 transition-all duration-300 ${hovered || locked
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
        <div className="nav-side-menu">
          <button
            type="button"
            onClick={toggleMapFocus}
            className={`inline-flex items-center justify-center cursor-pointer transition-colors ${isMapFocus ? 'text-(--yellow)' : 'text-inherit hover:text-white'}`}
            aria-label={isMapFocus ? 'Exit map focus mode' : 'Enter map focus mode'}
            aria-pressed={isMapFocus}
            title={isMapFocus ? 'ปิดโหมดเน้นแผนที่' : 'เน้นแผนที่ (ซ่อนการ์ด/แผงด้านข้าง)'}
          >
            {isMapFocus
              ? <TbZoomReset className={iconClassName} />
              : <TbZoomInArea className={iconClassName} />}
          </button>
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
          <TbBrandGithubCopilot
            className={`${iconClassName} ${pathname?.startsWith("/admin/smart-search") ? "text-(--default-blue)" : ""}`}
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
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
            placement="bottom"
          >
            <Button
              shape="circle"
              icon={<TbDots />}
            />
          </Dropdown>
        </div>
      </div>
      <FindOnPageOverlay open={findOpen} onClose={() => setFindOpen(false)} />
      {contextHolder}
    </nav>
  )
}