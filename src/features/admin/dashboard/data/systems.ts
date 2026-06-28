export type SystemType =
  | "CCTV"
  | "VMS"
  | "WIM"
  | "Lighting"
  | "BridgeLighting"
  | "Tunnel"
  | "Counting"
  | "CrossWalk"
  | "Analytic"
  | "Traffic"

// `label` is display-only (legend chips + marker popups); all filter/logic keys
// off the SystemType key. Display names mirror DEVICE_BADGE (src/constants/cctv.ts):
// WIM→Tracking, Counting→Volume, Analytic→Incident, CrossWalk→Crosswalk.
export const SYSTEMS: Record<SystemType, { color: string; label: string; icon: string }> = {
  CCTV:           { color: "#003F87", label: "CCTV",            icon: "camera" },
  VMS:            { color: "#874600", label: "VMS",             icon: "monitor" },
  WIM:            { color: "#70196D", label: "Tracking",        icon: "scale" },
  Lighting:       { color: "#878000", label: "Lighting",        icon: "bulb" },
  BridgeLighting: { color: "#871000", label: "Bridge Lighting", icon: "bridge" },
  Tunnel:         { color: "#4D0087", label: "Tunnel",          icon: "tunnel" },
  Counting:       { color: "#007787", label: "Volume",          icon: "car" },
  CrossWalk:      { color: "#001287", label: "Crosswalk",       icon: "walk" },
  Analytic:       { color: "#00873B", label: "Incident",        icon: "chart" },
  Traffic:        { color: "#518700", label: "Traffic",         icon: "light" },
}

export const SYSTEM_TYPES = Object.keys(SYSTEMS) as SystemType[]
