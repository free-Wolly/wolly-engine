import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { v4 as uuidv4 } from "uuid";

interface EmployeeAttributes {
  id: string;
  name: string;
  phone: string;
  email?: string;
  salary: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeeCreationAttributes
  extends Omit<EmployeeAttributes, "id" | "createdAt" | "updatedAt"> {}

class Employee
  extends Model<EmployeeAttributes, EmployeeCreationAttributes>
  implements EmployeeAttributes
{
  public id!: string;
  public name!: string;
  public phone!: string;
  public email!: string;
  public salary!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Employee.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => `EMPLOYEE-${uuidv4()}`,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
      allowNull: true,
    },
    salary: {
      type: DataTypes.DECIMAL(10, 4),
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
    modelName: "Employee",
    tableName: "Employees",
  }
);

Employee.beforeCreate(async (employee: Employee) => {
  const date = new Date();
  employee.createdAt = date;
  employee.updatedAt = date;
});

Employee.beforeUpdate(async (employee: Employee) => {
  employee.updatedAt = new Date();
});

export default Employee;
