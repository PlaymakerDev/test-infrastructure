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

export const SYSTEMS: Record<SystemType, { color: string; label: string; icon: string }> = {
  CCTV:           { color: "#003F87", label: "CCTV",            icon: "camera" },
  VMS:            { color: "#874600", label: "VMS",             icon: "monitor" },
  WIM:            { color: "#70196D", label: "WIM",             icon: "scale" },
  Lighting:       { color: "#878000", label: "Lighting",        icon: "bulb" },
  BridgeLighting: { color: "#871000", label: "Bridge Lighting", icon: "bridge" },
  Tunnel:         { color: "#4D0087", label: "Tunnel",          icon: "tunnel" },
  Counting:       { color: "#007787", label: "Counting",        icon: "car" },
  CrossWalk:      { color: "#001287", label: "CrossWalk",       icon: "walk" },
  Analytic:       { color: "#00873B", label: "Analytic",        icon: "chart" },
  Traffic:        { color: "#518700", label: "Traffic",         icon: "light" },
}

export const SYSTEM_TYPES = Object.keys(SYSTEMS) as SystemType[]
