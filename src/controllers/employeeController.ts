import { Request, Response } from "express";
import Employee from "../models/employee";
import WorkSchedule from "../models/workSchedule";

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { name, phone, salary, schedules } = req.body;
    const employee = await Employee.create({ name, phone, salary });

    if (schedules && schedules.length > 0) {
      const workSchedules = schedules.map((schedule: any) => ({
        ...schedule,
        employeeId: employee.id,
      }));
      await WorkSchedule.bulkCreate(workSchedules);
    }

    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllEmployees = async (_req: Request, res: Response) => {
  try {
    const employees = await Employee.findAll({
      include: [{ model: WorkSchedule }],
    });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{ model: WorkSchedule }],
    });
    if (employee) {
      res.status(200).json(employee);
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { name, phone, salary, schedules } = req.body;
    const employee = await Employee.findByPk(req.params.id);
    if (employee) {
      await employee.update({ name, phone, salary });

      if (schedules && schedules.length > 0) {
        await WorkSchedule.destroy({ where: { employeeId: employee.id } });
        const workSchedules = schedules.map((schedule: any) => ({
          ...schedule,
          employeeId: employee.id,
        }));
        await WorkSchedule.bulkCreate(workSchedules);
      }

      res.status(200).json(employee);
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (employee) {
      await WorkSchedule.destroy({ where: { employeeId: employee.id } });
      await employee.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
