import { PromiseProperties } from "../shared";
import { APIRequestVMSList, APIResponseVMSList, APIResponseVMSOverview, APIResponseVMSRandomOnline, APIResponseVMSTotal } from "./overview-api";

export interface VMSOverviewState {
  vms_overview: APIResponseVMSOverview;
  vms_random_online: APIResponseVMSRandomOnline[];
  vms_total: APIResponseVMSTotal;
  vms_list: VMSListState;
  task_schedules: PromiseModules;
}

export interface VMSListState {
  search: APIRequestVMSList;
  data: APIResponseVMSList;
}

export interface PromiseModules {
  vms_overview: PromiseProperties;
  vms_random_online: PromiseProperties;
  vms_total: PromiseProperties;
  vms_list: PromiseProperties;
}

