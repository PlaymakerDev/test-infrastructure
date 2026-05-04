import { PromiseProperties } from "./shared";

// API
export type APIGetResponseAdmin = AdminMe;

// REDUX
export interface AdminState {
  me: AdminMe;
  task_schedules: AdminTaskSchedule;
}

export interface AdminMe {
  user_id: string;
}

export interface AdminTaskSchedule {
  me: PromiseProperties;
}
