export interface WorkScheduleResponse {
  id: string;
  employeeId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkScheduleRequest {
  employeeId: string;
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

export interface UpdateWorkScheduleRequest {
  employeeId?: string;
  workday?:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  workStartTime?: string;
  workEndTime?: string;
}

export type GetAllWorkSchedulesResponse = WorkScheduleResponse[];
