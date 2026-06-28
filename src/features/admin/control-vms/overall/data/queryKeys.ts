export const controlVmsKeys = {
  all: ['control-vms'] as const,
  departments: () => [...controlVmsKeys.all, 'departments'] as const,
  settingTypes: () => [...controlVmsKeys.all, 'setting-types'] as const,
  media: () => [...controlVmsKeys.all, 'media'] as const,
  mediaList: (settingTypeId: number | undefined) =>
    [...controlVmsKeys.media(), settingTypeId ?? 'all'] as const,
  mediaDetail: (id?: string | number) =>
    [...controlVmsKeys.media(), 'detail', String(id ?? '')] as const,
  contact: (id?: number | string) => [...controlVmsKeys.all, 'contact', String(id ?? '')] as const,
  upcomingSummary: () => [...controlVmsKeys.all, 'upcoming-summary'] as const,
  settingByRoad: () => [...controlVmsKeys.all, 'setting-by-road'] as const,
  settingByRoadList: (roadCode?: string) =>
    [...controlVmsKeys.settingByRoad(), roadCode ?? 'all'] as const,
  schedule: () => [...controlVmsKeys.all, 'schedule'] as const,
  scheduleList: (month?: number, year?: number) =>
    [...controlVmsKeys.schedule(), month ?? 'all', year ?? 'all'] as const,
  settingList: () => [...controlVmsKeys.all, 'setting-list'] as const,
  settingListSearch: (search?: string) =>
    [...controlVmsKeys.settingList(), search ?? ''] as const,
}
