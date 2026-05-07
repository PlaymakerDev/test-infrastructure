import { PROVINCES } from "./provinces"
import { SYSTEM_TYPES, type SystemType } from "./systems"
import { BTCH_CENTRAL, KHTCH_UNITS } from "./units"

export type Device = {
  id: string
  type: SystemType
  unitId: string         // khtch-<code> or btch-<id>
  stch: number
  coord: [number, number]
  road: string           // "นย.006"
  km: string             // "กม.7+955"
  landmark: string
  status: "online" | "offline" | "fault"
}

// Seeded RNG สำหรับ deterministic output (ไม่ให้สลับตำแหน่งทุกครั้งที่ refresh)
function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// น้ำหนักการกระจายประเภทอุปกรณ์ (CCTV เยอะสุด → Traffic น้อยสุด)
const TYPE_WEIGHTS: Record<SystemType, number> = {
  CCTV: 45,
  Counting: 12,
  Lighting: 10,
  VMS: 8,
  CrossWalk: 6,
  WIM: 5,
  BridgeLighting: 5,
  Analytic: 4,
  Tunnel: 3,
  Traffic: 2,
}

function weightedPick(rand: () => number): SystemType {
  const total = SYSTEM_TYPES.reduce((s, t) => s + TYPE_WEIGHTS[t], 0)
  let r = rand() * total
  for (const t of SYSTEM_TYPES) {
    r -= TYPE_WEIGHTS[t]
    if (r <= 0) return t
  }
  return "CCTV"
}

function pickStatus(rand: () => number): Device["status"] {
  const r = rand()
  if (r < 0.86) return "online"
  if (r < 0.96) return "fault"
  return "offline"
}

// กระจายพิกัดรอบจุดศูนย์กลาง (radius เป็นองศา ~ 111km/1deg)
function scatter(
  center: [number, number],
  rand: () => number,
  radiusDeg = 0.25
): [number, number] {
  const angle = rand() * Math.PI * 2
  const r = Math.sqrt(rand()) * radiusDeg
  return [center[0] + r * Math.cos(angle), center[1] + r * Math.sin(angle) * 0.85]
}

const LANDMARKS = [
  "ป้ายน้ำ", "สะพาน", "แยก", "ทางแยก", "หน้าวัด", "หน้าโรงเรียน",
  "ตลาด", "ทางเข้าหมู่บ้าน", "คลอง", "สี่แยก", "ทางลอด",
]

function makeId(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`
}

function makeDevice(
  rand: () => number,
  unitId: string,
  stch: number,
  baseCoord: [number, number],
  provinceCode: string,
  idx: number,
  radius: number
): Device {
  const type = weightedPick(rand)
  const roadLevel = Math.floor(rand() * 5) + 1 // 1..5
  const roadNum = String(Math.floor(rand() * 9000) + 1000)
  const road = `${provinceCode}.${roadLevel}${roadNum.slice(1)}`
  const km = `${Math.floor(rand() * 40)}+${String(Math.floor(rand() * 1000)).padStart(3, "0")}`
  const landmark = LANDMARKS[Math.floor(rand() * LANDMARKS.length)]
  return {
    id: makeId(`${provinceCode.toUpperCase()}${type.slice(0, 3).toUpperCase()}`, idx),
    type,
    unitId,
    stch,
    coord: scatter(baseCoord, rand, radius),
    road,
    km: `กม.${km}`,
    landmark: `${landmark}${Math.floor(rand() * 500)}`,
    status: pickStatus(rand),
  }
}

export function generateDevices(): Device[] {
  const rand = makeRng(20260424)
  const devices: Device[] = []
  let serial = 0

  // ขทช. 77 แห่ง — จำนวนอุปกรณ์ต่อ ขทช. สุ่ม 8-28
  for (const unit of KHTCH_UNITS) {
    const count = Math.floor(rand() * 20) + 8
    const province = PROVINCES.find((p) => p.code === unit.provinceCode)!
    for (let i = 0; i < count; i++) {
      serial++
      devices.push(
        makeDevice(rand, unit.id, unit.stch!, unit.center, province.code, serial, 0.35)
      )
    }
  }

  // บทช. ส่วนกลาง 5 แห่ง — จำนวนต่อหน่วย 20-40
  for (const unit of BTCH_CENTRAL) {
    const count = Math.floor(rand() * 20) + 20
    for (let i = 0; i < count; i++) {
      serial++
      devices.push(
        makeDevice(rand, unit.id, unit.stch!, unit.center, "นบ", serial, 0.08)
      )
    }
  }

  return devices
}
