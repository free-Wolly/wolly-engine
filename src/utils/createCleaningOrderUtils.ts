import Address from "../models/address";
import CleaningOrder, {
  OrderDetails,
  ServiceOptions,
} from "../models/cleaningOrder";
import {
  CRMCleaningOrderResponse,
  CustomerCleaningOrderResponse,
  CustomerInfo,
} from "../types/cleaningOrder";
import { toAddressResponse } from "./addressUtils";

const serviceOptions: ServiceOptions = {
  insideOven: false,
  walls: false,
  insideWindow: false,
  insideFridge: false,
  insideCabinets: false,
  insideDishwasher: false,
  insideGarage: false,
  microwave: false,
  washLaundry: false,
  insideWasherDryer: false,
  swimmingPool: false,
};

const orderDetails: OrderDetails = {
  rooms: {
    livingRoom: 0,
    kitchen: 0,
    bathroom: 0,
    bedroom: 0,
    squareMeters: 0,
  },
  balcony: {
    squareMeters: 0,
  },
};

export const createServiceOptions = (
  providedServiceOptions: Partial<ServiceOptions>
) => {
  Object.keys(providedServiceOptions).forEach((key) => {
    if (providedServiceOptions[key as keyof ServiceOptions] === true) {
      serviceOptions[key as keyof ServiceOptions] = true;
    }
  });

  return serviceOptions;
};

export const checkIfServiceOptionsAreValid = (
  providedServiceOptions: Partial<ServiceOptions>
) => {
  return Object.keys(providedServiceOptions).every((key) =>
    Object.keys(serviceOptions).includes(key)
  );
};

export const checkIfOrderDetailsAreValid = (
  providedOrderDetails: OrderDetails
) => {
  // CHECK FOR ALL REQUIRED KEYS
  if (
    !Object.keys(providedOrderDetails).every((key) =>
      Object.keys(orderDetails).includes(key)
    )
  ) {
    return false;
  }

  const { squareMeters, ...rooms } = providedOrderDetails.rooms;

  // TODO: DO WE ALLOW ONLY BALCONY CLEANING?
  if (
    Object.values(providedOrderDetails.rooms).some((value) => value < 0) || //CHECK FOR NEGATIVE ROOM VALUES
    Object.values(rooms).every((value) => value === 0) || //CHECK AT LEAST ONE ROOM SHOULD BE SELECTED
    squareMeters === 0 || //CHECK THAT SQUARE METERS ARE NOT ZERO
    providedOrderDetails.balcony.squareMeters < 0 //CHECK FOR NEGATIVE BALCONY VALUE
  ) {
    return false;
  }

  return true;
};

export const toCustomerCleaningOrderResponse = (
  orderModel: CleaningOrder,
  addressModel: Address,
  customerInfo?: CustomerInfo
): CustomerCleaningOrderResponse => {
  const order = orderModel.toJSON();
  const address = toAddressResponse(addressModel);
  return {
    id: order.id,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customerName: customerInfo ? customerInfo.customerName : order.customerName,
    customerLastname: customerInfo
      ? customerInfo.customerLastname
      : order.customerLastname,
    customerPhone: customerInfo
      ? customerInfo.customerPhone
      : order.customerPhone,
    startTime: order.startTime.toISOString(),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    price: order.price,
    serviceType: order.serviceType,
    serviceOptions: order.serviceOptions,
    occurance: order.occurance,
    address: address,
    comment: order.comment,
    canceledAt: order.canceledAt?.toISOString(),
    endTime: order.endTime?.toISOString(),
  };
};

export const toCRMCleaningOrderResponse = (
  orderModel: CleaningOrder,
  addressModel: Address
): CRMCleaningOrderResponse => {
  const { createdAt, updatedAt, startTime, canceledAt, endTime, ...order } =
    orderModel.toJSON();
  const address = toAddressResponse(addressModel);
  return {
    ...order,
    address: address,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    startTime: startTime.toISOString(),
    canceledAt: canceledAt?.toISOString(),
    endTime: endTime?.toISOString(),
  };
};
