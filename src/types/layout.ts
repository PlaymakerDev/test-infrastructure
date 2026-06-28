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

/** Extra info cell appended to the CCTVModal's standard 6-cell grid. Kept as
 *  plain data (no JSX) so it travels through Redux. Used by Traffic Signal to
 *  carry its Phase / PCU / Green Time / Efficiency / road-type cells. */
export interface CCTVModalExtraCell {
  /** Key into CCTVModal's icon map (e.g. "phase", "pcu"). Falls back to a default icon. */
  iconKey?: string;
  label: string;
  value: string;
  /** Text/border color. */
  color?: string;
  /** Render the value as an outlined pill instead of plain text. */
  pill?: boolean;
}

export interface CCTVModalProperties extends DrawerProperties {
  camera_id?: number | string | null;
  /** Optional feature-specific cells appended after the 6 standard ones. */
  extra_cells?: CCTVModalExtraCell[];
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