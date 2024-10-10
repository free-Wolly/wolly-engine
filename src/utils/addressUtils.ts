import Address from "../models/address";
import { AddressResponse } from "../types/address";

export const toAddressResponse = (addressModel: Address): AddressResponse => {
  const address = addressModel.toJSON();

  return {
    ...address,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
};
