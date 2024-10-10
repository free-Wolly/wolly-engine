import { Request, Response } from "express";
import WorkSchedule, { WORK_DAYS } from "../models/workSchedule";
import Employee from "../models/employee";
import {
  CreateWorkScheduleRequest,
  UpdateWorkScheduleRequest,
  WorkScheduleResponse,
} from "../types/workSchedule";
import { ErrorResponse } from "../types/error";
import { toWorkScheduleResponse } from "../utils/workScheduleUtils";
import { body, validationResult } from "express-validator";

export const createWorkSchedule = [
  body("employeeId").notEmpty().withMessage("employeeId field is required"),
  body("workday")
    .notEmpty()
    .withMessage("workday field is required")
    .isIn(WORK_DAYS),
  body("workStartTime")
    .notEmpty()
    .withMessage("workStartTime field is required")
    .isISO8601(),
  body("workEndTime")
    .notEmpty()
    .withMessage("workEndTime field is required")
    .isISO8601(),
  body()
    .custom((_, { req }) => {
      const workStartTime = new Date(req.body.workStartTime);
      const workEndTime = new Date(req.body.workEndTime);
      return workStartTime < workEndTime;
    })
    .withMessage("workStartTime must be before workEndTime"),
  async (
    req: Request<{}, {}, CreateWorkScheduleRequest>,
    res: Response<WorkScheduleResponse | ErrorResponse>
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
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
  },
];

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

export const updateWorkSchedule = [
  body("employeeId")
    .optional()
    .isUUID()
    .withMessage("employeeId field is invalid"),
  body("workday")
    .optional()
    .isIn(WORK_DAYS)
    .withMessage("workday field is invalid"),
  body("workStartTime")
    .optional()
    .isISO8601()
    .withMessage("workStartTime field is invalid"),
  body("workEndTime")
    .optional()
    .isISO8601()
    .withMessage("workEndTime field is invalid"),
  async (
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
  },
];

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
