import { APIResponseSidebar } from "./layout/api";
import { PromiseProperties } from "./shared";

export interface LayoutState {
  task_schedules: PromiseProperties;
  drawer: DrawerProperties;
  sidebar: APIResponseSidebar;
}

export interface DrawerProperties {
  open: boolean;
}