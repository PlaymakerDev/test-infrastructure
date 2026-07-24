import type { FilterConfig } from '@/components/searchable/SearchBar'

export type MobileWeightFilter = 'all' | 'normal' | 'overweight' | 'axisover'

export const MOBILE_WEIGHT_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#3b82f6',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-blue-800 text-white',
    badgeIdleClass: 'bg-blue-500/20 text-blue-400',
  },
  {
    key: 'normal',
    label: 'น้ำหนักปกติ',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#0A0A0A',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'overweight',
    label: 'น้ำหนักรวมเกิน',
    colorPrimary: '#ef4444',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
  {
    key: 'axisover',
    label: 'น้ำหนักเพลาเกิน',
    colorPrimary: '#FF7B00',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-orange-800 text-white',
    badgeIdleClass: 'bg-orange-500/20 text-orange-400',
  },
]

// Per product spec, mobile's is_over_weight convention is inverted from wim's 'Y'/'N':
// normal weight sends 1, overweight sends 0. 'all' omits the param entirely
// (BaseService/axios drops undefined params).
export const MOBILE_IS_OVER_WEIGHT_BY_FILTER: Record<MobileWeightFilter, number | undefined> = {
  all: 0,
  normal: 0,
  overweight: 2,
  axisover: 3
}
