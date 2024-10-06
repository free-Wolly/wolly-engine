import WorkSchedule from "../models/workSchedule";
import { WorkScheduleResponse } from "../types/workSchedule";

export const toWorkScheduleResponse = (
  workSchedule: WorkSchedule
): WorkScheduleResponse => {
  const workScheduleJSON = workSchedule.toJSON();
  return {
    ...workScheduleJSON,
    workStartTime: workScheduleJSON.workStartTime.toISOString(),
    workEndTime: workScheduleJSON.workEndTime.toISOString(),
    createdAt: workScheduleJSON.createdAt.toISOString(),
    updatedAt: workScheduleJSON.updatedAt.toISOString(),
  };
};
