import { PromiseProperties } from "./shared/redux";

export interface LayoutState {
  task_schedules: PromiseProperties;
  drawer: DrawerProperties;
}

export interface DrawerProperties {
  open: boolean;
}