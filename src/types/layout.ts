import { APIResponseSidebar } from "./layout/api";
import { PromiseProperties } from "./shared";

export interface LayoutState {
  loading: boolean;
  fullscreen_loading: boolean;
  drawer: DrawerProperties;
  cctv_modal: CCTVModalProperties;
  project_info_modal: ProjectInfoModalProperties;
  sidebar: APIResponseSidebar;
  task_schedules: PromiseModules;
}

export interface CCTVModalProperties extends DrawerProperties {
  camera_id?: number | string | null;
}

export interface ProjectInfoModalProperties extends DrawerProperties {
  project_id?: number | string | null;
  road_id?: number | string | null;
}

export interface DrawerProperties {
  open: boolean;
}

export interface PromiseModules {
  sidebar: PromiseProperties
}