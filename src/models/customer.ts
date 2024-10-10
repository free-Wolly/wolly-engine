import { Model, DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sequelize from "../config/database";
import { v4 as uuidv4 } from "uuid";

export interface CustomerAttributes {
  id: string;
  username: string;
  name: string;
  lastname: string;
  email?: string;
  phone: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerCreationAttributes
  extends Omit<CustomerAttributes, "id" | "createdAt" | "updatedAt"> {}

class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  public id!: string;
  public username!: string;
  public name!: string;
  public lastname!: string;
  public email!: string;
  public phone!: string;
  public passwordHash!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  public generateToken(): string {
    return jwt.sign(
      {
        id: this.id,
        username: this.username,
        name: this.name,
        lastname: this.lastname,
        email: this.email,
        phone: this.phone,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      },
      process.env.CUSTOMER_JWT_SECRET || "your-secret-key"
    );
  }

  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}

Customer.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => `CUSTOMER-${uuidv4()}`,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
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
    modelName: "Customer",
    tableName: "Customers",
  }
);

Customer.beforeCreate(async (customer: Customer) => {
  const salt = await bcrypt.genSalt(10);
  const date = new Date();
  customer.passwordHash = await bcrypt.hash(customer.passwordHash, salt);
  customer.createdAt = date;
  customer.updatedAt = date;
});

Customer.beforeUpdate(async (customer: Customer) => {
  customer.updatedAt = new Date();
});

export default Customer;
