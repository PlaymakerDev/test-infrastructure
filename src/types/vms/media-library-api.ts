export interface VMSMediaItem {
  id: number
  url: string
  name: string
  filename?: string
  mime_type?: string
  setting_type_id?: number
  setting_type_name?: string
  uploaded_by?: string
  uploaded_at: string
}

export interface VMSMediaListMeta {
  count: number
  page: number
  limit: number
  total_pages: number
}

export interface APIResponseVMSMediaList {
  res_data: VMSMediaItem[]
  meta_data: VMSMediaListMeta
}

export interface APIRequestVMSMediaList {
  setting_type_id?: number
  search?: string
  limit?: number
  page?: number
}

export interface VMSMediaCategoryCount {
  setting_type_id: number | null
  setting_type_name: string
  count: number
}

export type APIResponseVMSMediaCategoryCounts = VMSMediaCategoryCount[]

export interface APIRequestVMSMediaCreate {
  url: string
  name?: string
  filename?: string
  mime_type?: string
  setting_type_id?: number | null
}

export interface APIRequestVMSMediaUpdate {
  name?: string
  setting_type_id?: number | null
}

export interface APIRequestVMSMediaBulkDelete {
  ids: number[]
}
