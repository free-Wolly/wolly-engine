import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import Address from "../models/address";
import {
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressPaginationResponse,
} from "../types/address";

import CleaningOrder, { OrderStatus } from "../models/cleaningOrder";

import { ErrorResponse } from "../types/error";
import { toAddressResponse } from "../utils/addressUtils";
import {
  generatePaginationResponse,
  getPaginationParams,
} from "../utils/paginateUtils";
import sequelize from "../config/database";
import { Op } from "sequelize";

export const createAddress = [
  body("street").notEmpty().isString().withMessage("Street is required"),
  body("city").notEmpty().isString().withMessage("City is required"),
  body("postalCode")
    .notEmpty()
    .isString()
    .withMessage("Postal code is required"),
  body("country").notEmpty().isString().withMessage("Country is required"),
  body("latitude").optional().isString().withMessage("Latitude is invalid"),
  body("longitude").optional().isString().withMessage("Longitude is invalid"),
  body("isDefault").optional().isBoolean().withMessage("isDefault is invalid"),
  async (
    req: Request<{ customerId: string }, {}, CreateAddressRequest>,
    res: Response<AddressResponse | ErrorResponse>
  ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const transaction = await sequelize.transaction();

    try {
      const {
        street,
        city,
        postalCode,
        country,
        latitude,
        longitude,
        isDefault,
      } = req.body;
      const customerId = req.params.customerId;

      if (isDefault) {
        await Address.update(
          { isDefault: false },
          {
            where: { customerId: req.params.customerId, isDefault: true },
            transaction,
          }
        );
      }

      const newAddress = await Address.create(
        {
          customerId,
          street,
          city,
          postalCode,
          country,
          latitude,
          longitude,
          isDefault,
        },
        { transaction }
      );

      if (!newAddress) {
        await transaction.rollback();
        return res.status(400).json({ error: "Failed to create address" });
      }

      await transaction.commit();
      res.status(201).json(toAddressResponse(newAddress));
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating address:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

export const updateAddress = [
  body("street").optional().isString().withMessage("Street is invalid"),
  body("city").optional().isString().withMessage("City is invalid"),
  body("postalCode")
    .optional()
    .isString()
    .withMessage("Postal code is invalid"),
  body("country").optional().isString().withMessage("Country is invalid"),
  body("latitude").optional().isString().withMessage("Latitude is invalid"),
  body("longitude").optional().isString().withMessage("Longitude is invalid"),
  body("isDefault").optional().isBoolean().withMessage("isDefault is invalid"),
  async (
    req: Request<
      { customerId: string; addressId: string },
      {},
      UpdateAddressRequest
    >,
    res: Response<AddressResponse | ErrorResponse>
  ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const transaction = await sequelize.transaction();
    try {
      const cleaningOrder = await CleaningOrder.findOne({
        where: {
          addressId: req.params.addressId,
          customerId: req.params.customerId,
          orderStatus: {
            [Op.not]: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
          },
        },
        transaction,
      });

      if (cleaningOrder) {
        return res.status(400).json({
          error:
            "Address is being used in an uncompleted or uncancelled cleaning order",
        });
      }

      if (req.body.isDefault) {
        await Address.update(
          { isDefault: false },
          {
            where: { customerId: req.params.customerId, isDefault: true },
            transaction,
          }
        );
      }

      const updatedAddress = await Address.update(req.body, {
        where: { id: req.params.addressId, customerId: req.params.customerId },
        transaction,
      });

      if (!updatedAddress) {
        await transaction.rollback();
        return res.status(400).json({ error: "Failed to update address" });
      }

      const address = await Address.findOne({
        where: { id: req.params.addressId, customerId: req.params.customerId },
      });

      if (!address) {
        await transaction.rollback();
        return res.status(400).json({ error: "Address not found" });
      }

      await transaction.commit();
      res.status(200).json(toAddressResponse(address));
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating address:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

export const getAddresses = async (
  req: Request<{ customerId: string }, {}, CreateAddressRequest>,
  res: Response<AddressPaginationResponse | ErrorResponse>
) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const customerId = req.params.customerId;

    const result = await Address.findAndCountAll({
      distinct: true,
      offset: limit * page,
      limit: limit,
      order: [["createdAt", "DESC"]],
      where: { customerId: customerId },
    });

    const transformedResult = {
      rows: result.rows.map(toAddressResponse),
      count: result.count,
    };

    const paginationResponse = generatePaginationResponse(
      transformedResult,
      page,
      limit
    );

    const defaultAddress = await Address.findOne({
      where: { customerId: customerId, isDefault: true },
    });

    const response = {
      paginationResult: paginationResponse,
      defaultAddress: defaultAddress
        ? toAddressResponse(defaultAddress)
        : undefined,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
