export const controlVmsKeys = {
  all: ['control-vms'] as const,
  departments: () => [...controlVmsKeys.all, 'departments'] as const,
  settingTypes: () => [...controlVmsKeys.all, 'setting-types'] as const,
  media: () => [...controlVmsKeys.all, 'media'] as const,
  mediaList: (settingTypeId: number | undefined) =>
    [...controlVmsKeys.media(), settingTypeId ?? 'all'] as const,
  mediaUrlList: (settingTypeId: number | undefined, page: number, limit: number) =>
    [...controlVmsKeys.media(), 'urls', settingTypeId ?? 'all', page, limit] as const,
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
  byStatus: () => [...controlVmsKeys.all, 'by-status'] as const,
  byStatusList: (statusId?: number) =>
    [...controlVmsKeys.byStatus(), statusId ?? 'all'] as const,
  statusCounts: () => [...controlVmsKeys.all, 'status-counts'] as const,
  byVmsIdsPrefix: () => [...controlVmsKeys.all, 'by-vms-ids'] as const,
  byVmsIds: (vmsIds: number[]) =>
    [...controlVmsKeys.byVmsIdsPrefix(), [...vmsIds].sort((a, b) => a - b)] as const,
  history: () => [...controlVmsKeys.all, 'history'] as const,
  historyBySetting: (settingID: number | undefined) =>
    [...controlVmsKeys.history(), 'setting', settingID ?? 0] as const,
  historyByCrossing: (crossingMasterIndex: string | undefined) =>
    [...controlVmsKeys.history(), 'crossing', crossingMasterIndex ?? ''] as const,
}
