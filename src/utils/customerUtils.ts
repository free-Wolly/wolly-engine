import Customer from "../models/customer";
import { CustomerAuthResponse } from "../types/customer";

export const toCustomerAuthResponse = (
  customer: Customer,
  token: string
): CustomerAuthResponse => {
  const customerAtt = { ...customer.toJSON() };
  const { passwordHash, createdAt, updatedAt, ...rest } = customerAtt;
  return {
    customer: {
      ...rest,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    },
    token,
  };
};
