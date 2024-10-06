import { EmployeeResponse } from "../types/employee";
import Employee from "../models/employee";
import WorkSchedule from "../models/workSchedule";

export const toEmployeeResponse = (
  employee: Employee & { schedules: WorkSchedule[] }
): EmployeeResponse => {
  return {
    ...employee.toJSON(),
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
    schedules: employee.schedules
      .map((x) => x.toJSON())
      .map((s) => ({
        ...s,
        workStartTime: s.workStartTime.toISOString(),
        workEndTime: s.workEndTime.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
  };
};
