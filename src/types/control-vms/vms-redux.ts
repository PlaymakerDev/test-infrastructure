import { APIRequestVMSMedia, APIResponseVMSSettingType } from "./vms-api"

export interface ControlVMSState {
  media: VMSMedia
  media_type: APIResponseVMSSettingType
}

export interface VMSMedia {
  search: APIRequestVMSMedia
}