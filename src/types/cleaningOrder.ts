import {
  ServiceOptions,
  Occurance,
  ServiceType,
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
  OrderDetails,
} from "../models/cleaningOrder";
import { AddressResponse, CreateAddressRequest } from "./address";
import { CleaningOrderAttributes } from "../models/cleaningOrder";

export interface CustomerInfo {
  customerName: string;
  customerLastname: string;
  customerPhone: string;
  customerId?: string;
}

export interface CustomerCreateCleaningOrderRequest {
  guestCustomer?: {
    name: string;
    lastname: string;
    phone: string;
  };
  startTime: string;
  paymentMethod: PaymentMethod;
  serviceType: ServiceType;
  serviceOptions: Partial<ServiceOptions>;
  occurance: Occurance;
  orderDetails: OrderDetails;
  address?: CreateAddressRequest;
  addressId?: string;
  comment?: string;
}

export interface CustomerUpdateCleaningOrderRequest {
  startTime?: string;
  comment?: string;
}

export interface CustomerCancelOrderRequest {
  cancekComment?: string;
}

export interface CustomerCleaningOrderResponse extends CustomerInfo {
  id: string;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  startTime: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  price: number;
  serviceType: ServiceType;
  serviceOptions: ServiceOptions;
  occurance: Occurance;
  address: AddressResponse;
  canceledAt?: string;
  endTime?: string;
  comment?: string;
}

// CRM

export type CRMCleaningOrderResponse = Omit<
  CleaningOrderAttributes,
  "createdAt" | "updatedAt" | "startTime" | "endTime" | "canceledAt"
> & {
  createdAt: string;
  updatedAt: string;
  startTime: string;
  endTime?: string;
  canceledAt?: string;
  address: AddressResponse;
};

export enum CleaningOrderFilterSortField {
  startTime = "startTime",
  endTime = "endTime",
  price = "price",
  duration = "duration",
  closedAt = "closedAt",
}

export enum CleaningOrderFilterSortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export interface CRMCleaningOrderFilter {
  customerId?: string;
  status?: OrderStatus;
  sort?: {
    field: CleaningOrderFilterSortField;
    order: CleaningOrderFilterSortOrder;
  };
}

export interface CRMCleaningOrderRequest
  extends Omit<
    CleaningOrderAttributes,
    "createdAt" | "updatedAt" | "startTime" | "endTime" | "canceledAt"
  > {
  startTime: string;
  endTime?: string;
  canceledAt?: string;
  address?: CreateAddressRequest;
}
