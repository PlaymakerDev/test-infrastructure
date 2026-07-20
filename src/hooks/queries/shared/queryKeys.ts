export const sharedKeys = {
  all: ['shared'] as const,
  contactDetail: (projectId?: string | number | null) =>
    [...sharedKeys.all, 'contact-detail', String(projectId ?? '')] as const,
} as const
