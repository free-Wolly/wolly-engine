import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { v4 as uuidv4 } from "uuid";
import CleaningOrder from "./cleaningOrder";

interface AddressAttributes {
  id: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  latitude?: string;
  longitude?: string;
  isDefault?: boolean;
  customerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AddressCreationAttributes
  extends Omit<AddressAttributes, "id" | "createdAt" | "updatedAt"> {}

class Address
  extends Model<AddressAttributes, AddressCreationAttributes>
  implements AddressAttributes
{
  public id!: string;
  public street!: string;
  public city!: string;
  public country!: string;
  public postalCode!: string;
  public latitude?: string;
  public longitude?: string;
  public isDefault!: boolean;
  public customerId!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Address.init(
  {
    id: {
      type: DataTypes.STRING,
      defaultValue: () => `ADDRESS-${uuidv4()}`,
      primaryKey: true,
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Address",
    tableName: "Addresses",
  }
);

Address.beforeCreate(async (address) => {
  const date = new Date();
  address.createdAt = date;
  address.createdAt = date;
});

Address.beforeUpdate(async (address) => {
  address.updatedAt = new Date();
});

export default Address;
