import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

interface EmployeeAttributes {
  id?: number;
  name: string;
  phone: string;
  salary: number;
}

interface EmployeeCreationAttributes extends Omit<EmployeeAttributes, "id"> {}

class Employee
  extends Model<EmployeeAttributes, EmployeeCreationAttributes>
  implements EmployeeAttributes
{
  public id!: number;
  public name!: string;
  public phone!: string;
  public salary!: number;
}

Employee.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    salary: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Employee",
  }
);

export default Employee;
