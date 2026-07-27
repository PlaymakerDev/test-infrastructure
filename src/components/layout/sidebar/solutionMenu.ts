import type { ComponentType } from 'react'
import {
  TbHome,
  TbVideo,
  TbCar,
  TbTrafficLights,
  TbWalk,
  TbBolt,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbAdjustmentsHorizontal,
  TbBriefcase,
  TbShieldHalf,
  TbCarCrash,
} from 'react-icons/tb'
import IconLPR from '@/components/icon/IconLPR'
import IconTracking from '@/components/icon/IconTracking'
import IconAIChat from '@/components/icon/IconAIChat'
import menu from '@/configs/menu'

/** Shared between SidebarContent (สำนัก tab, grouped by department) and
 *  SidebarRoute's DataDisplaySection (สายทาง tab, scoped to one road) — both
 *  render the same solution-type icon/label/route lookups, just against a
 *  different API response shape. */
export const SOLUTION_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  "Dashboard": TbHome,
  "CCTV": TbVideo,
  "Traffic Volume": TbCar,
  "Incident Detection": TbCarCrash,
  "Traffic Signal": TbTrafficLights,
  "Crosswalk": TbWalk,
  "Traffic Lighting": TbBolt,
  "VMS": TbDeviceDesktop,
  "Bridge Lighting": TbBuildingBridge,
  "Tunnel": TbBuildingBridge2,
  "Tracking": IconTracking,
  // Same custom scan-frame glyph as the navbar's LPR menu (IconLPR).
  "LPR": IconLPR,
  "Control VMS": TbAdjustmentsHorizontal,
  "Statistic": TbBriefcase,
  "Maintenance": TbShieldHalf,
  // AI-chat glyph (Hugeicons ai-chat-01) — same as the navbar shortcut.
  "Smart Search": IconAIChat,
}

// Display-name overrides for API solution_type_name values. Key = raw API
// string, value = label rendered in the sidebar. Icon/route lookups still
// key off the API string above.
export const SOLUTION_DISPLAY_LABEL: Record<string, string> = {
  "Tracking": "Truck Tracking",
}

export type RouteEntry = { path: string; path_active: string; path_list: string[] }

export const buildPathMap = (): Record<string, RouteEntry> => {
  const map: Record<string, RouteEntry> = {}
  for (const item of menu["ADMIN"]) {
    map[item.label] = { path: item.path, path_active: item.path_active, path_list: item.path_list ?? [] }
  }
  return map
}

export const collapseVariants = {
  open: { height: "auto", opacity: 1, transition: { duration: 0.28, ease: "easeInOut" as const } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.22, ease: "easeInOut" as const } },
}

export const solutionContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
}

export const solutionItemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
}
