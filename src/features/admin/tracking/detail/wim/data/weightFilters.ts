import type { FilterConfig } from '@/components/searchable/SearchBar'

export type WeightFilter = 'all' | 'normal' | 'overweight'

export const WEIGHT_FILTERS: FilterConfig[] = [
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
    label: 'น้ำหนักเกิน',
    colorPrimary: '#ef4444',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
]

// 'all' omits `is_over_weight` entirely (BaseService/axios drops undefined params).
export const IS_OVER_WEIGHT_BY_FILTER: Record<WeightFilter, 'Y' | 'N' | undefined> = {
  all: undefined,
  normal: 'N',
  overweight: 'Y',
}
