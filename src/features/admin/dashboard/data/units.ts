import { PROVINCES } from "./provinces"

export type Unit = {
  id: string
  level: "stch" | "khtch" | "btch"
  code: string
  name: string
  parentId: string | null
  center: [number, number] // [lng, lat]
  provinceCode?: string    // for ขทช.
  stch?: number            // parent สทช. number
  hqProvinceName?: string  // for สทช. (ชื่อจังหวัดที่ตั้ง HQ)
}

// 18 สทช. — HQ พิกัดของจังหวัดที่ตั้งสำนักงาน
const STCH_HQ_PROVINCE: Record<number, string> = {
  1: "ปท", 2: "สบ", 3: "ชบ", 4: "พบ", 5: "นม", 6: "ขก",
  7: "อบ", 8: "นว", 9: "อต", 10: "ชม", 11: "สฎ", 12: "สข",
  13: "ฉช", 14: "กบ", 15: "อด", 16: "กส", 17: "ชร", 18: "สพ",
}

export const STCH_UNITS: Unit[] = Array.from({ length: 18 }, (_, i) => {
  const n = i + 1
  const hqCode = STCH_HQ_PROVINCE[n]
  const hqProvince = PROVINCES.find((p) => p.code === hqCode)!
  return {
    id: `stch-${n}`,
    level: "stch",
    code: `สทช.${n}`,
    name: `สำนักงานทางหลวงชนบทที่ ${n} (${hqProvince.name})`,
    parentId: null,
    center: hqProvince.coord,
    stch: n,
    hqProvinceName: hqProvince.name,
  }
})

// 77 ขทช. (1 ต่อจังหวัด) — ใช้พิกัดเมืองหลักของจังหวัดเป็น HQ
// (กทม. ไม่มี ขทช. — ใช้ บทช. ส่วนกลางแทน)
export const KHTCH_UNITS: Unit[] = PROVINCES.filter((p) => !p.central).map((p) => ({
  id: `khtch-${p.code}`,
  level: "khtch" as const,
  code: `ขทช.${p.name}`,
  name: `แขวงทางหลวงชนบท ${p.name}`,
  parentId: `stch-${p.stch}`,
  center: p.coord,
  provinceCode: p.code,
  stch: p.stch,
}))

// 5 บทช. ส่วนกลาง (สังกัด สำนักบำรุงทาง — ถือว่าอยู่ในพื้นที่เดียวกับ สทช.1)
// พิกัดเอาจากตำแหน่งถนนจริงโดยประมาณ
export const BTCH_CENTRAL: Unit[] = [
  {
    id: "btch-kalpaphruek",
    level: "btch",
    code: "บทช.กัลปพฤกษ์",
    name: "หมวดบำรุงทางหลวงชนบท กัลปพฤกษ์",
    parentId: "stch-1",
    center: [100.435, 13.730],
    stch: 1,
  },
  {
    id: "btch-nakhonin",
    level: "btch",
    code: "บทช.นครอินทร์",
    name: "หมวดบำรุงทางหลวงชนบท นครอินทร์",
    parentId: "stch-1",
    center: [100.495, 13.859],
    stch: 1,
  },
  {
    id: "btch-ratchaphruek",
    level: "btch",
    code: "บทช.ราชพฤกษ์",
    name: "หมวดบำรุงทางหลวงชนบท ราชพฤกษ์",
    parentId: "stch-1",
    center: [100.465, 13.810],
    stch: 1,
  },
  {
    id: "btch-chaiyaphruek",
    level: "btch",
    code: "บทช.ชัยพฤกษ์",
    name: "หมวดบำรุงทางหลวงชนบท ชัยพฤกษ์",
    parentId: "stch-1",
    center: [100.488, 13.910],
    stch: 1,
  },
  {
    id: "btch-ringroad",
    level: "btch",
    code: "บทช.วงแหวนฯ",
    name: "หมวดบำรุงทางหลวงชนบท วงแหวนอุตสาหกรรม",
    parentId: "stch-1",
    center: [100.560, 13.670],
    stch: 1,
  },
]

export const ALL_UNITS: Unit[] = [...STCH_UNITS, ...KHTCH_UNITS, ...BTCH_CENTRAL]
