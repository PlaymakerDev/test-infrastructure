import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkDeleteVMSMediaAPI,
  createVMSMediaAPI,
  deleteVMSMediaAPI,
  getVMSMediaCategoryCountsAPI,
  listVMSMediaAPI,
  updateVMSMediaAPI,
} from '@/services/routes/VMSMediaLibraryService'
import type {
  APIRequestVMSMediaCreate,
  APIRequestVMSMediaList,
  APIRequestVMSMediaUpdate,
} from '@/types/vms/media-library-api'

const KEYS = {
  all: ['vms-media-library'] as const,
  list: (p: APIRequestVMSMediaList) =>
    [
      ...KEYS.all,
      'list',
      p.setting_type_id ?? 'all',
      p.search ?? '',
      p.limit ?? 24,
      p.page ?? 1,
    ] as const,
  counts: () => [...KEYS.all, 'counts'] as const,
}

export function useMediaLibraryList(params: APIRequestVMSMediaList) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => listVMSMediaAPI(params),
    placeholderData: keepPreviousData,
    staleTime: 5_000,
  })
}

export function useMediaCategoryCounts() {
  return useQuery({
    queryKey: KEYS.counts(),
    queryFn: () => getVMSMediaCategoryCountsAPI(),
    staleTime: 30_000,
  })
}

export function useCreateVMSMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: APIRequestVMSMediaCreate) => createVMSMediaAPI(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export function useUpdateVMSMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: APIRequestVMSMediaUpdate }) =>
      updateVMSMediaAPI(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export function useDeleteVMSMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteVMSMediaAPI(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export function useBulkDeleteVMSMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => bulkDeleteVMSMediaAPI(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}
