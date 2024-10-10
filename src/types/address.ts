// id: string;
// street: string;
// city: string;
// country: string;
// postalCode: string;
// latitude?: number;
// longitude?: number;
// isDefault?: boolean;
// customerId?: string;
// createdAt: Date;
// updatedAt: Date;

import { PaginationResponse } from "./pagination";

export interface CreateAddressRequest {
  street: string;
  city: string;
  country: string;
  postalCode: string;
  latitude?: string;
  longitude?: string;
  isDefault?: boolean;
}

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

export interface AddressResponse {
  id: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  latitude?: string;
  longitude?: string;
  isDefault?: boolean;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressPaginationResponse {
  paginationResult: PaginationResponse<AddressResponse>;
  defaultAddress?: AddressResponse;
}
