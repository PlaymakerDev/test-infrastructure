import { PromiseProperties } from "./shared";

export interface LayoutState {
  task_schedules: PromiseProperties;
  drawer: DrawerProperties;
}

export interface DrawerProperties {
  open: boolean;
}