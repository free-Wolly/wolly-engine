import { body, validationResult } from "express-validator";
import Customer from "../models/customer";
import { Request, Response } from "express";
import {
  CustomerAuthResponse,
  RegisterCustomerRequest,
} from "../types/customer";
import { Op } from "sequelize";
import { toCustomerAuthResponse } from "../utils/customerUtils";
import { ErrorResponse } from "../types/error";

// TODO: THESE ROUTES NEED BETTER VALIDATION

// TODO: ADD CRM ROUTE CONTROLLERS FOR CUSTOMERS

export const register = [
  body("username").trim().notEmpty().withMessage("username is required"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("name").trim().notEmpty().withMessage("name is required"),
  body("lastname").trim().notEmpty().withMessage("lastName is required"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("phome is required")
    .isMobilePhone("any")
    .withMessage("phone is invalid"),
  async (req: Request<{}, {}, RegisterCustomerRequest>, res: Response) => {
    const { username, email, password, phone, name, lastname } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const existingCustomer = await Customer.findOne({
      where: { [Op.or]: [{ username }, { email }, { phone }] },
    });

    if (existingCustomer) {
      return res
        .status(400)
        .json({ error: "Username or email or phone already exists" });
    }

    const customer = await Customer.create({
      username,
      email,
      passwordHash: password,
      phone,
      name,
      lastname,
    });
    const token = customer.generateToken();

    res.status(201).json(toCustomerAuthResponse(customer, token));
  },
];

export const login = async (
  req: Request,
  res: Response<CustomerAuthResponse | ErrorResponse>
) => {
  const { username, password } = req.body;
  const customer = await Customer.findOne({ where: { username } });
  if (!customer) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const isMatch = await customer.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = customer.generateToken();
  res.json(toCustomerAuthResponse(customer, token));
};
