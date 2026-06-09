import { PromiseProperties } from "../shared";
import { APIResponseVMSOverview, APIResponseVMSRandomOnline, APIResponseVMSTotal } from "./overview-api";

export interface VMSOverviewState {
  vms_overview: APIResponseVMSOverview;
  vms_random_online: APIResponseVMSRandomOnline[];
  vms_total: APIResponseVMSTotal;
  task_schedules: PromiseModules;
}

export interface PromiseModules {
  vms_overview: PromiseProperties;
  vms_random_online: PromiseProperties;
  vms_total: PromiseProperties;
}

