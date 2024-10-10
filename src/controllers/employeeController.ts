import { Request, Response } from "express";
import Employee from "../models/employee";
import WorkSchedule, { WorkScheduleAttributes } from "../models/workSchedule";
import {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeResponse,
} from "../types/employee";
import { ErrorResponse } from "../types/error";
import {
  generatePaginationResponse,
  getPaginationParams,
} from "../utils/paginateUtils";
import { PaginationResponse } from "../types/pagination";
import { toEmployeeResponse } from "../utils/employeeUtils";
import { body, validationResult } from "express-validator";
import { WORK_DAYS } from "../models/workSchedule";
import sequelize from "../config/database";

type EmployeeWithSchedules = Employee & { schedules: WorkSchedule[] };

export const createEmployee = [
  body("name").trim().notEmpty().withMessage("name field is required"),
  body("phone")
    .trim()
    .notEmpty()
    .isMobilePhone("any")
    .withMessage("phone field is invalid"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("email is invalid")
    .normalizeEmail(),
  body("salary").isNumeric().toFloat(),
  body("schedules")
    .isArray({ min: 1 })
    .withMessage("at least one schedule is required")
    .custom((schedules: WorkScheduleAttributes[]) => {
      return schedules.every((schedule) => {
        return (
          schedule.workday &&
          WORK_DAYS.includes(schedule.workday) &&
          schedule.workStartTime &&
          schedule.workEndTime &&
          new Date(schedule.workStartTime) < new Date(schedule.workEndTime)
        );
      });
    })
    .withMessage("invalid schedules"),
  async (
    req: Request<{}, {}, CreateEmployeeRequest>,
    res: Response<EmployeeResponse | ErrorResponse>
  ) => {
    const transaction = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { name, phone, email, salary, schedules } = req.body;

      const existingEmployee = await Employee.findOne({
        where: { phone },
        transaction,
      });

      if (existingEmployee) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ error: "Employee with given phone already exists" });
      }

      const employee = await Employee.create(
        { name, phone, email, salary },
        { transaction }
      );

      if (!schedules) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ error: "At least one schedule is required" });
      }

      const workSchedules = schedules.map((s) => ({
        ...s,
        workStartTime: new Date(s.workStartTime),
        workEndTime: new Date(s.workEndTime),
        employeeId: employee.id,
      }));

      const newWorkSchedules = (
        await WorkSchedule.bulkCreate(workSchedules, { transaction })
      ).map((s) => s.toJSON());

      const response = {
        ...employee.toJSON(),
        createdAt: employee.createdAt.toISOString(),
        updatedAt: employee.updatedAt.toISOString(),
        schedules: newWorkSchedules.map((s) => ({
          ...s,
          workStartTime: s.workStartTime.toISOString(),
          workEndTime: s.workEndTime.toISOString(),
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      };

      await transaction.commit();
      res.status(201).json(response);
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: (error as Error).message });
    }
  },
];

export const getAllEmployees = async (
  req: Request,
  res: Response<PaginationResponse<EmployeeResponse> | ErrorResponse>
) => {
  const { page, limit } = getPaginationParams(req.query);

  try {
    const result = (await Employee.findAndCountAll({
      include: [{ model: WorkSchedule, as: "schedules" }],
      distinct: true,
      offset: limit * page,
      limit: limit,
      order: [["createdAt", "DESC"]],
    })) as {
      rows: EmployeeWithSchedules[];
      count: number;
    };

    const transformedResult = {
      rows: result.rows.map(toEmployeeResponse),
      count: result.count,
    };

    const response = generatePaginationResponse(transformedResult, page, limit);

    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getEmployeeById = async (
  req: Request<{ id: string }>,
  res: Response<EmployeeResponse | ErrorResponse>
) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{ model: WorkSchedule, as: "schedules" }],
    });

    if (employee) {
      const response = toEmployeeResponse(employee as EmployeeWithSchedules);
      res.status(200).json(response);
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateEmployee = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("name should not be invalid"),
  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .isMobilePhone("any")
    .withMessage("phone field is invalid"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("email is invalid")
    .normalizeEmail(),
  body("salary").optional().isNumeric().withMessage("invalid salary").toFloat(),
  async (
    req: Request<{ id: string }, {}, UpdateEmployeeRequest>,
    res: Response<EmployeeResponse | ErrorResponse>
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { name, phone, email, salary } = req.body;
      const employee = await Employee.findByPk(req.params.id, {
        include: [{ model: WorkSchedule, as: "schedules" }],
      });

      if (employee) {
        if (email) {
          employee.email = email;
        }

        if (salary) {
          employee.salary = salary;
        }

        if (name) {
          employee.name = name;
        }

        if (phone) {
          employee.phone = phone;
        }

        await employee.save();

        res
          .status(200)
          .json(toEmployeeResponse(employee as EmployeeWithSchedules));
      } else {
        res.status(404).json({ error: "Employee not found" });
      }
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
];

export const deleteEmployee = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (employee) {
      await WorkSchedule.destroy({ where: { employeeId: employee.id } });
      await employee.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
