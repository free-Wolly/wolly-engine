import { Request, Response } from "express";
import WorkSchedule from "../models/workSchedule";
import Employee from "../models/employee";
import {
  CreateWorkScheduleRequest,
  UpdateWorkScheduleRequest,
  WorkScheduleResponse,
} from "../types/workSchedule";
import { ErrorResponse } from "../types/error";
import { toWorkScheduleResponse } from "../utils/workScheduleUtils";

export const createWorkSchedule = async (
  req: Request<{}, {}, CreateWorkScheduleRequest>,
  res: Response<WorkScheduleResponse | ErrorResponse>
) => {
  try {
    const { employeeId, workday, workStartTime, workEndTime } = req.body;
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const workSchedule = await WorkSchedule.create({
      employeeId,
      workday,
      workStartTime: new Date(workStartTime),
      workEndTime: new Date(workEndTime),
    });
    res.status(201).json(toWorkScheduleResponse(workSchedule));
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getWorkScheduleById = async (
  req: Request<{ id: string }>,
  res: Response<WorkScheduleResponse | ErrorResponse>
) => {
  try {
    const workSchedule = await WorkSchedule.findByPk(req.params.id);
    if (workSchedule) {
      res.status(200).json(toWorkScheduleResponse(workSchedule));
    } else {
      res.status(404).json({ error: "Work schedule not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateWorkSchedule = async (
  req: Request<{ id: string }, {}, UpdateWorkScheduleRequest>,
  res: Response<WorkScheduleResponse | ErrorResponse>
) => {
  try {
    const { employeeId, workday, workStartTime, workEndTime } = req.body;
    const workSchedule = await WorkSchedule.findByPk(req.params.id);
    if (workSchedule) {
      if (employeeId) {
        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
          return res.status(404).json({ error: "Employee not found" });
        }
        workSchedule.employeeId = employeeId;
      }
      if (workStartTime) {
        workSchedule.workStartTime = new Date(workStartTime);
      }
      if (workEndTime) {
        workSchedule.workEndTime = new Date(workEndTime);
      }
      if (workday) {
        workSchedule.workday = workday;
      }
      await workSchedule.save();
      res.status(200).json(toWorkScheduleResponse(workSchedule));
    } else {
      res.status(404).json({ error: "Work schedule not found" });
    }
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteWorkSchedule = async (
  req: Request<{ id: string }>,
  res: Response<ErrorResponse>
) => {
  try {
    const workSchedule = await WorkSchedule.findByPk(req.params.id);
    if (workSchedule) {
      await workSchedule.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Work schedule not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
