import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import Employee from "./employee";
import { v4 as uuidv4 } from "uuid";

export interface WorkScheduleAttributes {
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
  workStartTime: Date;
  workEndTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkScheduleCreationAttributes
  extends Omit<WorkScheduleAttributes, "id" | "createdAt" | "updatedAt"> {}

class WorkSchedule
  extends Model<WorkScheduleAttributes, WorkScheduleCreationAttributes>
  implements WorkScheduleAttributes
{
  public id!: string;
  public employeeId!: string;
  public workday!:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  public workStartTime!: Date;
  public workEndTime!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
}

WorkSchedule.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => `SCHEDULE-${uuidv4()}`,
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Employee,
        key: "id",
      },
    },
    workday: {
      type: DataTypes.ENUM(
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY"
      ),
      allowNull: false,
    },
    workStartTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    workEndTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "WorkSchedule",
  }
);

Employee.hasMany(WorkSchedule, {
  foreignKey: "employeeId",
  sourceKey: "id",
  as: "schedules",
});
WorkSchedule.belongsTo(Employee, {
  foreignKey: "employeeId",
  targetKey: "id",
  as: "employee",
});

WorkSchedule.beforeCreate((workSchedule: WorkSchedule) => {
  const date = new Date();
  workSchedule.createdAt = date;
  workSchedule.updatedAt = date;
});

WorkSchedule.beforeUpdate((workSchedule: WorkSchedule) => {
  workSchedule.updatedAt = new Date();
});

export default WorkSchedule;
