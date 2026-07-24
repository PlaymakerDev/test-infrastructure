export type SystemType =
  | "CCTV"
  | "Counting"
  | "Analytic"
  | "Traffic"
  | "CrossWalk"
  | "Lighting"
  | "VMS"
  | "BridgeLighting"
  | "Tunnel"
  | "WIM"
  | "LPR"

// `label` is display-only (filter pills + marker popups/tooltips); all
// filter/logic keys off the SystemType key. Labels use the FULL navbar menu
// names (configs/menu/admin.ts) so the map pills read exactly like the menus
// above (per 2026-07-24 request — previously the short DEVICE_BADGE names:
// Volume/Incident/Traffic/Lighting). DEVICE_BADGE (table chips,
// src/constants/cctv.ts) keeps its own short names — different surface.
// KEY ORDER MATTERS: `SYSTEM_TYPES = Object.keys(SYSTEMS)` drives the map
// filter-pill row + cluster badge order — kept in the same order as the
// navbar menu per design 2026-07-13.
export const SYSTEMS: Record<SystemType, { color: string; label: string; icon: string }> = {
  CCTV:           { color: "#003F87", label: "CCTV",               icon: "camera" },
  Counting:       { color: "#007787", label: "Traffic Volume",     icon: "car" },
  Analytic:       { color: "#00873B", label: "Incident Detection", icon: "chart" },
  Traffic:        { color: "#518700", label: "Traffic Signal",     icon: "light" },
  CrossWalk:      { color: "#001287", label: "Crosswalk",          icon: "walk" },
  Lighting:       { color: "#878000", label: "Traffic Lighting",   icon: "bulb" },
  VMS:            { color: "#874600", label: "VMS",                icon: "monitor" },
  BridgeLighting: { color: "#871000", label: "Bridge Lighting",    icon: "bridge" },
  Tunnel:         { color: "#4D0087", label: "Tunnel",             icon: "tunnel" },
  WIM:            { color: "#70196D", label: "Truck Tracking",     icon: "scale" },
  LPR:            { color: "#87004D", label: "LPR",                icon: "scan" },
}

export const SYSTEM_TYPES = Object.keys(SYSTEMS) as SystemType[]

/**
 * Bright variant of each system color — same hue as `SYSTEMS[type].color` but
 * lightened for readability on the dark map. Use for map-popup borders + the
 * popup's system-name text (the dark `SYSTEMS` colors are the legend/fill tone
 * and read too dim as an outline). Mirrors DEVICE_BADGE's bright outline palette
 * (src/constants/cctv.ts) and extends it to Lighting / Bridge / Tunnel.
 */
export const SYSTEM_BRIGHT: Record<SystemType, string> = {
  CCTV:           "#4DA3FF", // ← #003F87
  Counting:       "#2DD4BF", // ← #007787
  Analytic:       "#3DD68C", // ← #00873B
  Traffic:        "#A3E635", // ← #518700
  CrossWalk:      "#7C8CFF", // ← #001287
  Lighting:       "#E8DF3D", // ← #878000
  VMS:            "#FF9F45", // ← #874600
  BridgeLighting: "#FF6B57", // ← #871000
  Tunnel:         "#B57BFF", // ← #4D0087
  WIM:            "#E879DE", // ← #70196D
  LPR:            "#FF6FB5", // ← #87004D
}
