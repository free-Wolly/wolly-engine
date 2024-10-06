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

type EmployeeWithSchedules = Employee & { schedules: WorkSchedule[] };

export const createEmployee = async (
  req: Request<{}, {}, CreateEmployeeRequest>,
  res: Response<EmployeeResponse | ErrorResponse>
) => {
  try {
    const { name, phone, email, salary, schedules } = req.body;

    console.log(req.body);

    const employee = await Employee.create({ name, phone, email, salary });

    if (!schedules) {
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

    const newWorkSchedules = (await WorkSchedule.bulkCreate(workSchedules)).map(
      (s) => s.toJSON()
    );

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

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

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

    console.log(result);

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

export const updateEmployee = async (
  req: Request<{ id: string }, {}, UpdateEmployeeRequest>,
  res: Response<EmployeeResponse | ErrorResponse>
) => {
  try {
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
};

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
