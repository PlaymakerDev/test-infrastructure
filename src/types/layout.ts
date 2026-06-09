import { APIResponseSidebar } from "./layout/api";
import { PromiseProperties } from "./shared";

export interface LayoutState {
  loading: boolean;
  fullscreen_loading: boolean;
  drawer: DrawerProperties;
  sidebar: APIResponseSidebar;
  task_schedules: PromiseModules;
}

export interface DrawerProperties {
  open: boolean;
}

export interface PromiseModules {
  sidebar: PromiseProperties
}