"use client"
import menu from "@/configs/menu"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  TbMenu2,
  TbZoomInArea,
  TbSearch,
  TbBellRinging2,
  TbDots,
  TbBrandGithubCopilot,
  // ICON LIST
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
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbTopologyStar3,
  TbAdjustmentsHorizontal,
  TbBriefcase,
} from "react-icons/tb"
import { BsFillGrid3X2GapFill } from "react-icons/bs"
import dayjs from "dayjs"
import buddhistEra from "dayjs/plugin/buddhistEra"
import th from "dayjs/locale/th"
import { useAppDispatch } from "@/stores/hooks"
import { setDrawerOpen } from "@/stores/reducers/layout/layoutSlice"
import { Button, Dropdown, MenuProps } from "antd"

dayjs.extend(buddhistEra)
dayjs().format("BBBB BB")
dayjs.locale(th)

const ICON_LIST: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbTopologyStar3,
  TbAdjustmentsHorizontal,
  TbBriefcase,
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const iconClassName = "fs-24 cursor-pointer"
  const dispatch = useAppDispatch()

  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm:ss"))
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format("HH:mm:ss"))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const items: MenuProps["items"] = [
    { key: "1", label: <TbZoomInArea className={iconClassName} /> },
    { key: "2", label: <TbSearch className={iconClassName} /> },
    { key: "3", label: <TbBellRinging2 className={iconClassName} /> },
    { key: "4", label: <BsFillGrid3X2GapFill className={iconClassName} /> },
  ]

  const Icon = useCallback(
    (iconName: string, props: { size?: number; className?: string }) => {
      const IconComponent = ICON_LIST[iconName]
      return IconComponent ? <IconComponent {...props} /> : null
    },
    []
  )

  const adminMenu = useMemo(() => menu["ADMIN"], [])

  const renderTrapezoidNav = useMemo(() => {
    return adminMenu.map((item) => {
      const active = pathname === item.path_active
      return (
        <button
          key={item.key}
          onClick={() => router.push(item.path)}
          className={`relative flex flex-col items-center justify-center gap-0.5 px-1.5 lg:px-3 h-full transition-colors shrink-0 cursor-pointer ${
            active ? "text-(--yellow)" : "text-white/70 hover:text-white"
          }`}
          title={item.title}
        >
          <span>{Icon(item.icon, { size: 20 })}</span>
          {active && (
            <span className="hidden lg:block text-[11px] font-medium text-(--yellow)">
              {item.label}
            </span>
          )}
        </button>
      )
    })
  }, [adminMenu, pathname, router, Icon])

  return (
    <nav className={`navbar ${scrolled ? " scrolled" : ""}`}>
      <div className="nav-container">
        {/* LEFT — hamburger + clock */}
        <div className="nav-main-menu shrink-0">
          <TbMenu2
            className={iconClassName}
            onClick={() => dispatch(setDrawerOpen({ open: true }))}
          />
          <div className="leading-tight hidden lg:block">
            <p className="fs-12 font-mono tracking-wider" suppressHydrationWarning>
              {currentTime}
            </p>
            <p className="fs-12" suppressHydrationWarning>
              {dayjs().format("DD MMMM BBBB")}
            </p>
          </div>
        </div>

        {/* CENTER — trapezoid nav */}
        <div
          className="flex-1 overflow-x-auto scrollbar-none mx-1 lg:mx-0 hidden lg:block"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            className={`relative flex items-center justify-center min-w-max lg:min-w-0 mx-auto gap-0.5 lg:gap-1 px-4 lg:px-6 transition-all duration-300 ${
              hovered
                ? "lg:opacity-100 lg:translate-y-0"
                : "lg:opacity-0 lg:-translate-y-2"
            }`}
            style={{ height: 48, maxWidth: 900 }}
          >
            {/* Background shape — trapezoid */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 810 48"
              preserveAspectRatio="none"
              style={{ filter: "drop-shadow(0px 2px 15px rgba(252, 209, 22, 0.6))" }}
            >
              <path
                d="M0,0 L810,0 L790,42 Q787,48 780,48 L30,48 Q23,48 20,42 L0,0Z"
                fill="rgba(0,0,0,0.6)"
                stroke="rgba(252,209,22,0.3)"
                strokeWidth="1"
              />
            </svg>
            {renderTrapezoidNav}
          </div>
        </div>

        {/* RIGHT — desktop side icons */}
        <div className="nav-side-menu shrink-0">
          <TbZoomInArea className={iconClassName} />
          <TbSearch className={iconClassName} />
          <TbBrandGithubCopilot className={iconClassName} />
          <TbBellRinging2 className={iconClassName} />
          <BsFillGrid3X2GapFill className={iconClassName} />
        </div>

        {/* MOBILE — dropdown */}
        <div className="mobile-side-menu">
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottom">
            <Button shape="circle" icon={<TbDots />} />
          </Dropdown>
        </div>
      </div>
    </nav>
  )
}
