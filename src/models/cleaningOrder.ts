import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { v4 as uuidv4 } from "uuid";
import Address from "./address";
import Customer from "./customer";

export enum OrderStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  CASH = "CASH",
  TERMINAL = "TERMINAL",
  CARD = "CARD",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ServiceType {
  REGULAR_CLEANING = "REGULAR_CLEANING",
  AFTER_RENOVATION = "AFTER_RENOVATION",
  CHEMICAL_CLEANING = "CHEMICAL_CLEANING",
}

export enum Occurance {
  ONE_TIME = "ONE_TIME",
  RECURRING = "RECURRING",
}

export interface ServiceOptions {
  insideOven: boolean;
  walls: boolean;
  insideWindow: boolean;
  insideFridge: boolean;
  insideCabinets: boolean;
  insideDishwasher: boolean;
  insideGarage: boolean;
  microwave: boolean;
  washLaundry: boolean;
  insideWasherDryer: boolean;
  swimmingPool: boolean;
}

export interface OrderDetails {
  rooms: {
    livingRoom: number;
    kitchen: number;
    bathroom: number;
    bedroom: number;
    squareMeters: number;
  };
  balcony: {
    squareMeters: number;
  };
}

export interface CleaningOrderAttributes {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  orderStatus: OrderStatus;
  startTime: Date;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  serviceType: ServiceType;
  serviceOptions: ServiceOptions;
  orderDetails: OrderDetails;
  occurance: Occurance;
  price: number;
  addressId: string;
  customerName: string;
  customerLastname: string;
  customerPhone: string;
  customerId?: string;
  assignedEmployees?: string[];
  comment?: string;
  canceledAt?: Date;
  endTime?: Date;
  assignedTools?: string[];
  orderReviews?: string[];
}

interface CleaningOrderCreationAttributes
  extends Omit<CleaningOrderAttributes, "id" | "createdAt" | "updatedAt"> {}

class CleaningOrder
  extends Model<CleaningOrderAttributes, CleaningOrderCreationAttributes>
  implements CleaningOrderAttributes
{
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public orderStatus!: OrderStatus;
  public startTime!: Date;
  public paymentMethod!: PaymentMethod;
  public paymentStatus!: PaymentStatus;
  public serviceType!: ServiceType;
  public serviceOptions!: ServiceOptions;
  public orderDetails!: OrderDetails;
  public occurance!: Occurance;
  public price!: number;
  public addressId!: string;
  public customerName!: string;
  public customerLastname!: string;
  public customerPhone!: string;
  public customerId?: string;
  public assignedEmployees?: string[];
  public comment?: string;
  public canceledAt?: Date;
  public endTime?: Date;
  public assignedTools?: string[];
  public orderReviews?: string[];
}

CleaningOrder.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => `ORDER-${uuidv4()}`,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    orderStatus: {
      type: DataTypes.ENUM,
      values: Object.values(OrderStatus),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM,
      values: Object.values(PaymentMethod),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM,
      values: Object.values(PaymentStatus),
      allowNull: false,
    },
    serviceType: {
      type: DataTypes.ENUM,
      values: Object.values(ServiceType),
      allowNull: false,
    },
    serviceOptions: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    orderDetails: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    occurance: {
      type: DataTypes.ENUM,
      values: Object.values(Occurance),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    addressId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerLastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedEmployees: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assignedTools: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    orderReviews: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "CleaningOrder",
    tableName: "CleaningOrders",
  }
);

CleaningOrder.belongsTo(Address, {
  foreignKey: "addressId",
  targetKey: "id",
  as: "address",
});
CleaningOrder.belongsTo(Customer, {
  foreignKey: "customerId",
  targetKey: "id",
  as: "customer",
});

CleaningOrder.beforeCreate(async (order) => {
  const date = new Date();
  order.createdAt = date;
  order.updatedAt = date;
});

CleaningOrder.beforeUpdate(async (order) => {
  order.updatedAt = new Date();
});

export default CleaningOrder;
