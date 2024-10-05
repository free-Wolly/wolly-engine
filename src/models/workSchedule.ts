import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import Employee from "./employee";

interface WorkScheduleAttributes {
  id?: number;
  employeeId: number;
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
}

interface WorkScheduleCreationAttributes
  extends Omit<WorkScheduleAttributes, "id"> {}

class WorkSchedule
  extends Model<WorkScheduleAttributes, WorkScheduleCreationAttributes>
  implements WorkScheduleAttributes
{
  public id!: number;
  public employeeId!: number;
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
}

WorkSchedule.init(
  {
    employeeId: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.TIME,
      allowNull: false,
    },
    workEndTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "WorkSchedule",
  }
);

Employee.hasMany(WorkSchedule);
WorkSchedule.belongsTo(Employee);

export default WorkSchedule;
