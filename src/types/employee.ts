import { WorkScheduleResponse } from "./workSchedule";

export interface CreateEmployeeRequest {
  name: string;
  phone: string;
  email?: string;
  salary: number;
  schedules: CreateWorkScheduleRequest[];
}

export interface CreateWorkScheduleRequest {
  workday:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  workStartTime: string;
  workEndTime: string;
}

export interface EmployeeResponse {
  id: string;
  name: string;
  phone: string;
  email?: string;
  salary: number;
  schedules: WorkScheduleResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  phone?: string;
  email?: string;
  salary?: number;
}
