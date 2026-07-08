"use client"
import menu from "@/configs/menu"
import type { AdminMenuItem } from "@/configs/menu/admin"
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TbMenu2,
  TbZoomInArea,
  TbSearch,
  TbBellRinging2,
  TbGripHorizontal,
  TbDots,
  // ICON
  TbForms,
  TbBrandDatabricks,
  TbApps,
  TbLayoutDashboard,
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
} from "react-icons/tb";
/* SEY DEFAULT YEAR FORMAT */
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import th from 'dayjs/locale/th';
import { useAppDispatch } from "@/stores/hooks";
import { setDrawerOpen } from "@/stores/reducers/layout/layoutSlice";
import { useHomeDeptId } from "@/hooks/queries/manage";
import { Button, Dropdown, MenuProps } from "antd";

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

// Design SVG icons (tracking.svg / text.svg) — inline so they inherit
// currentColor (turns yellow when active) and take a size prop like react-icons.
const IconTracking: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.75 13.75C3.75 13.4185 3.8817 13.1005 4.11612 12.8661C4.35054 12.6317 4.66848 12.5 5 12.5H7.5C7.83152 12.5 8.14946 12.6317 8.38388 12.8661C8.6183 13.1005 8.75 13.4185 8.75 13.75V16.25C8.75 16.5815 8.6183 16.8995 8.38388 17.1339C8.14946 17.3683 7.83152 17.5 7.5 17.5H5C4.66848 17.5 4.35054 17.3683 4.11612 17.1339C3.8817 16.8995 3.75 16.5815 3.75 16.25V13.75Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21.25 13.75C21.25 13.4185 21.3817 13.1005 21.6161 12.8661C21.8505 12.6317 22.1685 12.5 22.5 12.5H25C25.3315 12.5 25.6495 12.6317 25.8839 12.8661C26.1183 13.1005 26.25 13.4185 26.25 13.75V16.25C26.25 16.5815 26.1183 16.8995 25.8839 17.1339C25.6495 17.3683 25.3315 17.5 25 17.5H22.5C22.1685 17.5 21.8505 17.3683 21.6161 17.1339C21.3817 16.8995 21.25 16.5815 21.25 16.25V13.75Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.5 5C12.5 4.66848 12.6317 4.35054 12.8661 4.11612C13.1005 3.8817 13.4185 3.75 13.75 3.75H16.25C16.5815 3.75 16.8995 3.8817 17.1339 4.11612C17.3683 4.35054 17.5 4.66848 17.5 5V7.5C17.5 7.83152 17.3683 8.14946 17.1339 8.38388C16.8995 8.6183 16.5815 8.75 16.25 8.75H13.75C13.4185 8.75 13.1005 8.6183 12.8661 8.38388C12.6317 8.14946 12.5 7.83152 12.5 7.5V5Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.5 22.5C12.5 22.1685 12.6317 21.8505 12.8661 21.6161C13.1005 21.3817 13.4185 21.25 13.75 21.25H16.25C16.5815 21.25 16.8995 21.3817 17.1339 21.6161C17.3683 21.8505 17.5 22.1685 17.5 22.5V25C17.5 25.3315 17.3683 25.6495 17.1339 25.8839C16.8995 26.1183 16.5815 26.25 16.25 26.25H13.75C13.4185 26.25 13.1005 26.1183 12.8661 25.8839C12.6317 25.6495 12.5 25.3315 12.5 25V22.5Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23.75 12.5C23.75 10.8424 23.0915 9.25269 21.9194 8.08058C20.7473 6.90848 19.1576 6.25 17.5 6.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.25 17.5C6.25 19.1576 6.90848 20.7473 8.08058 21.9194C9.25269 23.0915 10.8424 23.75 12.5 23.75" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.25 12.5C6.25 10.8424 6.90848 9.25269 8.08058 8.08058C9.25269 6.90848 10.8424 6.25 12.5 6.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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
  const iconClassName = "fs-24 cursor-pointer"
  const dispatch = useAppDispatch()
  // STATE
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'))
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState(false)
  // Department of the logged-in user — appended to the owned menus' links.
  const homeDeptId = useHomeDeptId()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <TbZoomInArea className={iconClassName} />
    },
    {
      key: '2',
      label: <TbSearch className={iconClassName} />
    },
    {
      key: '3',
      label: <TbBellRinging2 className={iconClassName} />
    },
    {
      key: '4',
      label: <TbGripHorizontal className={iconClassName} />
    },
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
            className="relative flex flex-col items-center justify-center gap-0.5 px-1.5 lg:px-3 h-full text-white/70 hover:text-white shrink-0 cursor-default"
          >
            <span>
              <IconText size={24} />
            </span>
          </button>
        )
      }
      const item = node.item
      const active = pathname === item.path_active
      // Tracking uses the design SVG; everything else uses its admin.ts icon.
      const OverrideIcon = item.label_key === "tracking" ? IconTracking : undefined
      // Owned menus land on the user's own department; others navigate plainly.
      const href = DEPT_SCOPED_KEYS.has(item.label_key)
        ? `${item.path}?dept_id=${homeDeptId}`
        : item.path
      return (
        <button
          key={item.key}
          onClick={() => router.push(href)}
          className={`relative flex flex-col items-center justify-center gap-0.5 px-1.5 lg:px-3 h-full transition-colors shrink-0 cursor-pointer ${
            active ? "text-(--yellow)" : "text-white/70 hover:text-white"
          }`}
          title={item.title}
        >
          <span>{OverrideIcon ? <OverrideIcon size={24} /> : Icon(item.icon, { size: 24 })}</span>
          {active && (
            <span className="hidden lg:block text-[11px] font-medium text-(--yellow)">
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
        {/* CENTER — trapezoid nav (from phu2 backup): flush to top, 90px tall,
            absolutely positioned so it never affects the left/right sections. */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 z-20 hidden lg:block"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            className={`relative flex items-center justify-center gap-0.5 lg:gap-1 px-4 lg:px-6 transition-all duration-300 ${
              hovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }`}
            style={{ height: 60, width: 900, maxWidth: "90vw" }}
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
          </div>
        </div>
        <div className="nav-side-menu">
          <TbZoomInArea
            className={iconClassName}
          />
          <TbSearch
            className={iconClassName}
          />
          <TbBrandGithubCopilot
            className={`${iconClassName} ${pathname?.startsWith("/admin/smart-search") ? "text-(--default-blue)" : ""}`}
            onClick={() => router.push("/admin/smart-search")}
          />
          <TbBellRinging2
            className={iconClassName}
          />
          <TbGripHorizontal
            className={iconClassName}
          />
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
    </nav>
  )
}