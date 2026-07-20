import ApiService from '../ApiService'
import type {
  APIRequestVMSMediaBulkDelete,
  APIRequestVMSMediaCreate,
  APIRequestVMSMediaList,
  APIRequestVMSMediaUpdate,
  APIResponseVMSMediaCategoryCounts,
  APIResponseVMSMediaList,
  VMSMediaItem,
} from '@/types/vms/media-library-api'

export const listVMSMediaAPI = async (params: APIRequestVMSMediaList = {}) =>
  ApiService.fetchData<APIResponseVMSMediaList, APIRequestVMSMediaList>({
    url: '/vms/media',
    method: 'GET',
    params: { ...params },
  })

export const getVMSMediaCategoryCountsAPI = async () =>
  ApiService.fetchData<APIResponseVMSMediaCategoryCounts>({
    url: '/vms/media/category-counts',
    method: 'GET',
  })

export const createVMSMediaAPI = async (data: APIRequestVMSMediaCreate) =>
  ApiService.fetchData<VMSMediaItem, APIRequestVMSMediaCreate>({
    url: '/vms/media',
    method: 'POST',
    data,
  })

export const updateVMSMediaAPI = async (id: number, data: APIRequestVMSMediaUpdate) =>
  ApiService.fetchData<VMSMediaItem, APIRequestVMSMediaUpdate>({
    url: `/vms/media/${id}`,
    method: 'PUT',
    data,
  })

export const deleteVMSMediaAPI = async (id: number) =>
  ApiService.fetchData({
    url: `/vms/media/${id}`,
    method: 'DELETE',
  })

export const bulkDeleteVMSMediaAPI = async (ids: number[]) =>
  ApiService.fetchData<unknown, APIRequestVMSMediaBulkDelete>({
    url: '/vms/media/bulk-delete',
    method: 'POST',
    data: { ids },
  })
