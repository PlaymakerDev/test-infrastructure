import geographies from '@/mock/location-json/geographies.json'
import provinces from '@/mock/location-json/provinces.json'

const REGION_BY_PROVINCE: Record<string, string> = (() => {
  const geographyNameById = new Map(geographies.map((g) => [g.id, g.name]))
  const map: Record<string, string> = {}
  for (const province of provinces) {
    const regionName = geographyNameById.get(province.geography_id)
    if (regionName) map[province.name_th] = regionName
  }
  return map
})()

/** ภาค (region) ของจังหวัด ตาม `src/mock/location-json/{provinces,geographies}.json` — คืน `undefined` ถ้าไม่พบชื่อจังหวัด */
export const getProvinceRegion = (provinceName?: string | null): string | undefined => {
  if (!provinceName) return undefined
  return REGION_BY_PROVINCE[provinceName]
}
