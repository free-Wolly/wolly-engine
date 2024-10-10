import { Request, Response } from "express";
import CleaningOrder, {
  CleaningOrderAttributes,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ServiceType,
  ServiceOptions,
  Occurance,
} from "../models/cleaningOrder";
import Address from "../models/address";
import {
  CustomerCreateCleaningOrderRequest,
  CustomerCleaningOrderResponse,
  CustomerInfo,
  CustomerUpdateCleaningOrderRequest,
  CRMCleaningOrderResponse,
  CRMCleaningOrderFilter,
  CleaningOrderFilterSortField,
  CleaningOrderFilterSortOrder,
  CRMCleaningOrderRequest,
} from "../types/cleaningOrder";
import { ErrorResponse } from "../types/error";
import {
  checkIfOrderDetailsAreValid,
  checkIfServiceOptionsAreValid,
  createServiceOptions,
  toCRMCleaningOrderResponse,
  toCustomerCleaningOrderResponse,
} from "../utils/createCleaningOrderUtils";
import { PaginationResponse } from "../types/pagination";
import {
  generatePaginationResponse,
  getPaginationParams,
} from "../utils/paginateUtils";
import sequelize from "../config/database";
import { body, validationResult } from "express-validator";
import { CreateAddressRequest } from "../types/address";

type CleaningOrderWithAddress = CleaningOrder & { address: Address };

// CUSOMTER ROUTES

// TODO: PRICE CALCULATION
// TODO: VALIDATION
export const customerCreateCleaningOrder = [
  body("address")
    .optional()
    .isObject()
    .withMessage("address field should be an object")
    .custom((_, { req }) => {
      const address = req.body.address;

      // check if latitude and longitude are numbers
      if (address.latitude || address.longitude) {
        if (
          !address.latitude ||
          !address.longitude ||
          typeof address.latitude !== "string" ||
          typeof address.longitude !== "string"
        ) {
          return false;
        }
      }
      // address validation for fields street, city, country, postalCode,
      if (
        typeof address.street !== "string" ||
        typeof address.city !== "string" ||
        typeof address.country !== "string" ||
        typeof address.postalCode !== "string"
      ) {
        return false;
      }

      return true;
    })
    .withMessage("Invalid address object"),

  body("addressId")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid addressId"),

  body("guestCustomer")
    .optional()
    .isObject()
    .withMessage("Guest customer needs to be an object")
    .custom((_, { req }) => {
      const guestCustomer = req.body.guestCustomer;
      return (
        guestCustomer.name && guestCustomer.lastname && guestCustomer.phone
      );
    })
    .withMessage("Invalid guest customer object"),
  body("guestCustomer.phone")
    .optional()
    .trim()
    .isMobilePhone("any")
    .withMessage("Invalid guest customer phone number"),
  body("guestCustomer.name")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid guest customer name"),
  body("guestCustomer.lastname")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid guest customer lastname"),
  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Invalid start time"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isString()
    .withMessage("Invalid payment method")
    .isIn(Object.values(PaymentMethod))
    .withMessage("Invalid payment method"),
  body("serviceType")
    .notEmpty()
    .withMessage("Service type is required")
    .isString()
    .isIn(Object.values(ServiceType))
    .withMessage("Invalid service type"),
  body("serviceOptions")
    .notEmpty()
    .withMessage("Service options are required")
    .isObject()
    .withMessage("Invalid service options")
    .custom((_, { req }) => {
      const serviceOptions = req.body.serviceOptions;
      return (
        Object.keys(serviceOptions).length === 0 ||
        checkIfServiceOptionsAreValid(serviceOptions)
      );
    })
    .withMessage("Invalid service options"),
  body("orderDetails")
    .notEmpty()
    .withMessage("Order details are required")
    .isObject()
    .withMessage("Invalid order details")
    .custom((_, { req }) => checkIfOrderDetailsAreValid(req.body.orderDetails))
    .withMessage("Invalid order details"),
  body("occurance")
    .notEmpty()
    .withMessage("Occurance is required")
    .isString()
    .withMessage("Invalid occurance")
    .isIn(Object.values(Occurance)),
  body("comment")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid comment")
    .isLength({ max: 255 })
    .withMessage("Comment must be less than 255 characters"),
  async (
    req: Request<{}, {}, CustomerCreateCleaningOrderRequest>,
    res: Response<CustomerCleaningOrderResponse | ErrorResponse>
  ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const transaction = await sequelize.transaction();
    try {
      const {
        address,
        addressId,
        guestCustomer,
        startTime,
        paymentMethod,
        serviceType,
        serviceOptions,
        occurance,
        comment,
        orderDetails,
      } = req.body;

      let customerInfo: CustomerInfo | null = null;
      let resAddress: Address | null = null;

      // Check if registeered customer or guest customer is provided
      if (req.customer) {
        customerInfo = {
          customerName: req.customer.name,
          customerLastname: req.customer.lastname,
          customerPhone: req.customer.phone,
          customerId: req.customer.id,
        };
      } else if (guestCustomer) {
        customerInfo = {
          customerName: guestCustomer.name,
          customerLastname: guestCustomer.lastname,
          customerPhone: guestCustomer.phone,
        };
      } else {
        return res.status(400).json({
          error: "Customer token or guest customer parameters are required",
        });
      }

      // Check if address is provided

      if (addressId) {
        const address = await Address.findByPk(addressId, { transaction });
        if (!address) {
          return res
            .status(404)
            .json({ error: "Address not found by addressId" });
        }
        if (address.customerId !== customerInfo?.customerId) {
          await transaction.rollback();
          return res.status(400).json({
            error: "Address does not belong to the customer",
          });
        }
        resAddress = address;
      } else if (address) {
        const newAddress = await Address.create(
          {
            ...address,
          },
          { transaction }
        );
        resAddress = newAddress;
      } else {
        await transaction.rollback();
        return res.status(400).json({
          error:
            "Address is required, either address infromation or existing addressId",
        });
      }
      // Create cleaning order
      const newOrder = await CleaningOrder.create(
        {
          paymentMethod,
          serviceType,
          occurance,
          comment,
          ...customerInfo,
          serviceOptions: createServiceOptions(serviceOptions),
          startTime: new Date(startTime),
          addressId: resAddress.id,
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          price: 0, // TODO: PRICE CALCULATION
          orderDetails: orderDetails,
        },
        { transaction }
      );

      const response: CustomerCleaningOrderResponse =
        toCustomerCleaningOrderResponse(newOrder, resAddress, customerInfo);

      await transaction.commit();
      res.status(201).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      res.status(400).json({ error: "Error creating cleaning order" });
    }
  },
];

export const customerGetAllCleaningByCustomer = [
  async (
    req: Request,
    res: Response<
      PaginationResponse<CustomerCleaningOrderResponse> | ErrorResponse
    >
  ) => {
    try {
      const { page, limit } = getPaginationParams(req.query);

      const result = (await CleaningOrder.findAndCountAll({
        include: [{ model: Address, as: "address" }],
        distinct: true,
        offset: limit * page,
        limit: limit,
        order: [["createdAt", "DESC"]],
        where: { customerId: req.customer?.id },
      })) as {
        rows: CleaningOrderWithAddress[];
        count: number;
      };

      const transformedResult = {
        rows: result.rows.map((order) =>
          toCustomerCleaningOrderResponse(order, order.address)
        ),
        count: result.count,
      };

      const response = generatePaginationResponse(
        transformedResult,
        page,
        limit
      );

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ error: "Error fetching cleaning orders" });
    }
  },
];

export const customerGetCleaningOrderById = async (
  req: Request<{ customerId: string; cleaningOrderId: string }>,
  res: Response<CustomerCleaningOrderResponse | ErrorResponse>
) => {
  try {
    const order = (await CleaningOrder.findByPk(req.params.cleaningOrderId, {
      include: [{ model: Address, as: "address" }],
    })) as CleaningOrderWithAddress;

    if (!order) {
      return res.status(404).json({ error: "Cleaning order not found" });
    }

    if (order.customerId !== req.params.customerId) {
      return res.status(403).json({ error: "Invalid Request" });
    }

    const response: CustomerCleaningOrderResponse =
      toCustomerCleaningOrderResponse(order, order.address);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cleaning order" });
  }
};

// TODO: VALIDATE WHEN USER CAN CHANGE THE START TIME
export const customerUpdateCleaningOrder = [
  body("startTime").optional().isISO8601().withMessage("Invalid start time"),
  body("comment")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid comment")
    .isLength({ max: 255 })
    .withMessage("Comment must be less than 255 characters"),
  async (
    req: Request<{ id: string }, {}, CustomerUpdateCleaningOrderRequest>,
    res: Response<CustomerCleaningOrderResponse | ErrorResponse>
  ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { startTime, ...rest } = req.body;

      const updateQuery = {
        ...rest,
        startTime: startTime ? new Date(startTime) : undefined,
      };

      const [updated] = await CleaningOrder.update(updateQuery, {
        where: { id: req.params.id },
      });

      if (!updated) {
        return res
          .status(404)
          .json({ error: "Updated cleaning order not found" });
      }

      const updatedOrder = (await CleaningOrder.findByPk(req.params.id, {
        include: [{ model: Address, as: "address" }],
      })) as CleaningOrderWithAddress;

      const response: CustomerCleaningOrderResponse =
        toCustomerCleaningOrderResponse(updatedOrder, updatedOrder.address);
      res.status(200).json(response);
    } catch (error) {
      res.status(400).json({ error: "Error updating cleaning order" });
    }
  },
];

// TODO ADD CANCELLATION FOR CUSTOMER

// ---------------- CRM ROUTE CONTROLLERS

// TODO PRICE CALCULATION
export const createCleaningOrder = [
  body("address")
    .optional()
    .isObject()
    .withMessage("address field should be an object")
    .custom((_, { req }) => {
      const address = req.body.address;

      // check if latitude and longitude are strings
      if (address.latitude || address.longitude) {
        if (
          !address.latitude ||
          !address.longitude ||
          typeof address.latitude !== "string" ||
          typeof address.longitude !== "string"
        ) {
          return false;
        }
      }
      // address validation for fields street, city, country, postalCode,
      if (
        typeof address.street !== "string" ||
        typeof address.city !== "string" ||
        typeof address.country !== "string" ||
        typeof address.postalCode !== "string"
      ) {
        return false;
      }

      return true;
    })
    .withMessage("Invalid address object"),

  body("addressId")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid addressId"),

  body("customerName")
    .notEmpty()
    .withMessage("Customer name is required")
    .isString()
    .withMessage("Invalid customer name"),
  body("customerLastname")
    .notEmpty()
    .withMessage("Customer lastname is required")
    .isString()
    .withMessage("Invalid customer lastname"),
  body("customerPhone")
    .notEmpty()
    .withMessage("Customer phone is required")
    .isMobilePhone("any")
    .withMessage("Invalid customer phone"),
  body("customerId")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid customerId"),
  body("assignedEmployees")
    .optional()
    .isArray()
    .withMessage("Invalid assigned employees")
    .custom((_, { req }) => {
      const assignedEmployees = req.body.assignedEmployees;
      if (assignedEmployees.length === 0) {
        return false;
      }
      return true;
    })
    .withMessage("Invalid assigned employees"),
  body("assignedTools")
    .optional()
    .isArray()
    .withMessage("Invalid assigned tools")
    .custom((_, { req }) => {
      const assignedTools = req.body.assignedTools;
      if (assignedTools.length === 0) {
        return false;
      }
      return true;
    })
    .withMessage("Invalid assigned tools"),
  body("price")
    .optional()
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Invalid price"), // TODO: THIS IS TEMPORARY
  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Invalid start time"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isString()
    .withMessage("Invalid payment method")
    .isIn(Object.values(PaymentMethod)),
  body("serviceType")
    .notEmpty()
    .withMessage("Service type is required")
    .isString()
    .isIn(Object.values(ServiceType))
    .withMessage("Invalid service type"),
  body("serviceOptions")
    .notEmpty()
    .withMessage("Service options are required")
    .isObject()
    .withMessage("Invalid service options")
    .custom((_, { req }) => {
      const serviceOptions = req.body.serviceOptions;
      if (
        Object.keys(serviceOptions).length === 0 ||
        checkIfServiceOptionsAreValid(serviceOptions)
      ) {
        return true;
      }
      return false;
    })
    .withMessage("Invalid service options"),
  body("occurance")
    .notEmpty()
    .withMessage("Occurance is required")
    .isString()
    .withMessage("Invalid occurance")
    .isIn(Object.values(Occurance)),
  body("comment")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid comment")
    .isLength({ max: 255 })
    .withMessage("Comment must be less than 255 characters"),
  body("canceledAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid canceled at date")
    .custom((_, { req }) => {
      const canceledAt = req.body.canceledAt;
      if (canceledAt) {
        return new Date(canceledAt) < new Date(req.body.startTime);
      }
      return true;
    })
    .withMessage("Canceled at date must be before start time"),
  body("endTime")
    .optional()
    .isISO8601()
    .withMessage("Invalid end time")
    .custom((_, { req }) => {
      const endTime = req.body.endTime;
      if (endTime) {
        return new Date(endTime) > new Date(req.body.startTime);
      }
      return true;
    })
    .withMessage("End time must be after start time"),
  body("orderReviews")
    .optional()
    .isArray()
    .withMessage("Invalid order reviews")
    .custom((_, { req }) => {
      const orderReviews = req.body.orderReviews;
      if (orderReviews.length === 0) {
        return false;
      }
      return true;
    })
    .withMessage("Invalid order reviews"),
  body("orderDetails")
    .notEmpty()
    .withMessage("Order details are required")
    .isObject()
    .withMessage("Invalid order details")
    .custom((_, { req }) => checkIfOrderDetailsAreValid(req.body.orderDetails))
    .withMessage("Invalid order details"),
  async (
    req: Request<{}, {}, CRMCleaningOrderRequest>,
    res: Response<CRMCleaningOrderResponse | ErrorResponse>
  ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const transaction = await sequelize.transaction();
    try {
      const {
        serviceOptions,
        canceledAt,
        startTime,
        endTime,
        addressId,
        address,
        ...rest
      } = req.body;

      let newAddress: Address | null = null;

      if (!address && !addressId) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ error: "address or addressId is required" });
      }

      if (addressId) {
        newAddress = await Address.findByPk(addressId, { transaction });
        if (!newAddress) {
          await transaction.rollback();
          return res.status(404).json({ error: "Address not found" });
        }
      } else {
        newAddress = await Address.create(
          {
            ...address!,
          },
          { transaction }
        );
      }

      const newOrder = await CleaningOrder.create(
        {
          ...rest,
          serviceOptions: createServiceOptions(serviceOptions),
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : undefined,
          canceledAt: canceledAt ? new Date(canceledAt) : undefined,
          addressId: newAddress.id,
        },
        { transaction }
      );
      await transaction.commit();
      res.status(201).json(toCRMCleaningOrderResponse(newOrder, newAddress));
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: "Error creating cleaning order" });
    }
  },
];

export const getAllCleaningOrders = [
  body("customerId")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid customerId"),
  body("status").optional().trim().isString().withMessage("Invalid status"),
  body("sort")
    .optional()
    .isObject()
    .withMessage("Invalid sort")
    .custom((_, { req }) => {
      const sort = req.body.sort;
      if (sort.field || sort.order) {
        return (
          Object.values(CleaningOrderFilterSortField).includes(sort.field) &&
          Object.values(CleaningOrderFilterSortOrder).includes(sort.order)
        );
      }
      return true;
    })
    .withMessage("Invalid sort"),
  async (
    req: Request<{}, {}, CRMCleaningOrderFilter>,
    res: Response<PaginationResponse<CRMCleaningOrderResponse> | ErrorResponse>
  ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const request = req.body;

      const sortBy =
        request.sort?.order &&
        Object.values(CleaningOrderFilterSortOrder).includes(
          request.sort?.order
        )
          ? request.sort?.order
          : "DESC";

      const sortField =
        request.sort?.field &&
        Object.values(CleaningOrderFilterSortField).includes(
          request.sort?.field
        )
          ? request.sort?.field
          : "createdAt";

      const { page, limit } = getPaginationParams(req.query);

      const result = (await CleaningOrder.findAndCountAll({
        include: [{ model: Address, as: "address" }],
        distinct: true,
        offset: limit * page,
        limit: limit,
        order: [[sortField, sortBy]],
        where: {
          ...(request.customerId && { customerId: request.customerId }),
          ...(request.status && { status: request.status }),
        },
      })) as {
        rows: CleaningOrderWithAddress[];
        count: number;
      };

      const transformedResult = {
        rows: result.rows.map((order) =>
          toCRMCleaningOrderResponse(order, order.address)
        ),
        count: result.count,
      };

      const response = generatePaginationResponse(
        transformedResult,
        page,
        limit
      );

      res.status(200).json(response);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error fetching cleaning orders" });
    }
  },
];

export const getCleaningOrderById = async (
  req: Request<{ cleaningOrderId: string }>,
  res: Response<CRMCleaningOrderResponse | ErrorResponse>
) => {
  try {
    const order = (await CleaningOrder.findByPk(req.params.cleaningOrderId, {
      include: [{ model: Address, as: "address" }],
    })) as CleaningOrderWithAddress;

    if (!order) {
      return res.status(404).json({ error: "Cleaning order not found" });
    }

    const response: CRMCleaningOrderResponse = toCRMCleaningOrderResponse(
      order,
      order.address
    );
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cleaning order" });
  }
};

export const updateCleaningOrder = [
  body("addressId")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid addressId"),
  body("customerName")
    .optional()
    .notEmpty()
    .withMessage("Customer name is required")
    .isString()
    .withMessage("Invalid customer name"),
  body("customerLastname")
    .optional()
    .notEmpty()
    .withMessage("Customer lastname is required")
    .isString()
    .withMessage("Invalid customer lastname"),
  body("customerPhone")
    .optional()
    .notEmpty()
    .withMessage("Customer phone is required")
    .isMobilePhone("any")
    .withMessage("Invalid customer phone"),
  body("customerId")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid customerId"),
  body("assignedEmployees")
    .optional()
    .isArray()
    .withMessage("Invalid assigned employees")
    .custom((_, { req }) => {
      const assignedEmployees = req.body.assignedEmployees;
      if (assignedEmployees.length === 0) {
        return false;
      }
      return true;
    })
    .withMessage("Invalid assigned employees"),
  body("assignedTools")
    .optional()
    .isArray()
    .withMessage("Invalid assigned tools")
    .custom((_, { req }) => {
      const assignedTools = req.body.assignedTools;
      if (assignedTools.length === 0) {
        return false;
      }
      return true;
    })
    .withMessage("Invalid assigned tools"),
  body("price")
    .optional()
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Invalid price"), // TODO: THIS IS TEMPORARY
  body("startTime")
    .optional()
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Invalid start time"),
  body("paymentMethod")
    .optional()
    .notEmpty()
    .withMessage("Payment method is required")
    .isString()
    .withMessage("Invalid payment method")
    .isIn(Object.values(PaymentMethod)),
  body("serviceType")
    .notEmpty()
    .withMessage("Service type is required")
    .isString()
    .isIn(Object.values(ServiceType))
    .withMessage("Invalid service type"),
  body("serviceOptions")
    .optional()
    .notEmpty()
    .withMessage("Service options are required")
    .isObject()
    .withMessage("Invalid service options")
    .custom((_, { req }) => {
      const serviceOptions = req.body.serviceOptions;
      if (
        Object.keys(serviceOptions).length === 0 ||
        checkIfServiceOptionsAreValid(serviceOptions)
      ) {
        return true;
      }
      return false;
    })
    .withMessage("Invalid service options"),
  body("occurance")
    .optional()
    .notEmpty()
    .withMessage("Occurance is required")
    .isString()
    .withMessage("Invalid occurance")
    .isIn(Object.values(Occurance)),
  body("comment")
    .optional()
    .trim()
    .isString()
    .withMessage("Invalid comment")
    .isLength({ max: 255 })
    .withMessage("Comment must be less than 255 characters"),
  body("canceledAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid canceled at date")
    .custom((_, { req }) => {
      const canceledAt = req.body.canceledAt;
      if (canceledAt) {
        return new Date(canceledAt) < new Date(req.body.startTime);
      }
      return true;
    })
    .withMessage("Canceled at date must be before start time"),
  body("endTime")
    .optional()
    .isISO8601()
    .withMessage("Invalid end time")
    .custom((_, { req }) => {
      const endTime = req.body.endTime;
      if (endTime) {
        return new Date(endTime) > new Date(req.body.startTime);
      }
      return true;
    })
    .withMessage("End time must be after start time"),
  body("orderReviews")
    .optional()
    .isArray()
    .withMessage("Invalid order reviews")
    .custom((_, { req }) => {
      const orderReviews = req.body.orderReviews;
      if (orderReviews.length === 0) {
        return false;
      }
      return true;
    })
    .withMessage("Invalid order reviews"),
  async (
    req: Request<
      { cleaningOrderId: string },
      {},
      Partial<CleaningOrderAttributes>
    >,
    res: Response<CRMCleaningOrderResponse | ErrorResponse>
  ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const {
        serviceOptions,
        canceledAt,
        startTime,
        endTime,
        addressId,
        ...rest
      } = req.body;

      const updateQuery = {
        ...rest,
        serviceOptions: serviceOptions
          ? createServiceOptions(serviceOptions)
          : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        canceledAt: canceledAt ? new Date(canceledAt) : undefined,
      };

      const [updated] = await CleaningOrder.update(updateQuery, {
        where: { id: req.params.cleaningOrderId },
      });

      if (!updated) {
        return res.status(404).json({ error: "Cleaning order not found" });
      }

      const updatedOrder = (await CleaningOrder.findByPk(
        req.params.cleaningOrderId,
        {
          include: [{ model: Address, as: "address" }],
        }
      )) as CleaningOrderWithAddress;

      if (!updatedOrder) {
        return res
          .status(404)
          .json({ error: "Updated cleaning order not found" });
      }

      const response: CRMCleaningOrderResponse = toCRMCleaningOrderResponse(
        updatedOrder,
        updatedOrder.address
      );
      res.status(200).json(response);
    } catch (error) {
      res.status(400).json({ error: "Error updating cleaning order" });
    }
  },
];

export const deleteCleaningOrder = async (
  req: Request<{ id: string }>,
  res: Response<{} | ErrorResponse>
) => {
  try {
    const deleted = await CleaningOrder.destroy({
      where: { id: req.params.id },
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Cleaning order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting cleaning order", error });
  }
};
