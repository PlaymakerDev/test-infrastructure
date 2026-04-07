import { PromiseProperties } from "./shared/redux";

// API
export type APIGetResponseExample = ExampleMe;

// REDUX
export interface ExampleState {
  me: ExampleMe;
  task_schedules: ExampleTaskSchedule;
}

export interface ExampleMe {
  user_id: string;
}

export interface ExampleTaskSchedule {
  me: PromiseProperties;
}