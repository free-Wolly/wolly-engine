import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import Customer from "../models/customer";

interface JwtPayload {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

declare global {
  namespace Express {
    interface Request {
      customer?: Customer;
    }
  }
}

export const authenticateCustomer = async (
  req: Request<{ customerId: string }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(
      token,
      process.env.CUSTOMER_JWT_SECRET || "your-customer-secret-key-here"
    ) as JwtPayload;
    const customer = await Customer.findByPk(decoded.id);

    if (!customer) {
      throw new Error();
    }

    if (customer.id !== req.params.customerId) {
      throw new Error("Invalid Customer Id");
    }

    req.customer = customer;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

export const extractCustomer = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next();
  }

  const decoded = jwt.verify(
    token,
    process.env.CUSTOMER_JWT_SECRET || "your-customer-secret-key-here"
  ) as JwtPayload;

  const customer = await Customer.findByPk(decoded.id);

  if (!customer) {
    return next();
  }

  req.customer = customer;
  next();
};
