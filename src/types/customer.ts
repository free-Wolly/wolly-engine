import { CustomerAttributes } from "../models/customer";

export interface RegisterCustomerRequest {
  email?: string;
  username: string;
  password: string;
  name: string;
  lastname: string;
  phone: string;
}

export interface LoginCustomerRequest {
  username: string;
  password: string;
}

interface CustomerResposneAttributes
  extends Omit<CustomerAttributes, "passwordHash" | "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAuthResponse {
  customer: CustomerResposneAttributes;
  token: string;
}
