export const controlVmsKeys = {
  all: ['control-vms'] as const,
  departments: () => [...controlVmsKeys.all, 'departments'] as const,
  settingTypes: () => [...controlVmsKeys.all, 'setting-types'] as const,
  media: () => [...controlVmsKeys.all, 'media'] as const,
  mediaList: (settingTypeId: number | undefined) =>
    [...controlVmsKeys.media(), settingTypeId ?? 'all'] as const,
  contact: (id?: number | string) => [...controlVmsKeys.all, 'contact', id] as const,
}
