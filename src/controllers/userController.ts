import { Request, Response } from "express";
import User from "../models/user";
import {
  RegisterUserRequest,
  LoginUserRequest,
  UpdateUserRequest,
  AuthResponse,
  UserResponse,
} from "../types/user";
import { ErrorResponse } from "../types/error";
import { PaginationResponse } from "../types/pagination";
import { transformUser } from "../utils/userUtils";
import {
  getPaginationParams,
  generatePaginationResponse,
} from "../utils/paginateUtils";
import { body, validationResult } from "express-validator";

import bcrypt from "bcrypt";

export const createUser = [
  body("email").isEmail().withMessage("email is invalid").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage(
      "password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("name").trim().notEmpty().withMessage("name field is required"),
  body("role").optional().isString().isIn(["ADMIN", "USER"]),
  async (
    req: Request<{}, {}, RegisterUserRequest>,
    res: Response<AuthResponse | ErrorResponse>
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, name, password, role } = req.body;

      const userExist = await User.findOne({ where: { email } });

      if (userExist) {
        return res.status(400).json({ error: "Email already in use" });
      }

      if (role && role === "ADMIN" && req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "You are not authorized" });
      }

      const user = await User.create({
        email,
        name,
        passwordHash: password,
        role: role || "USER",
      });

      const token = user.generateToken();

      res.status(201).json({ user: transformUser(user), token });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
];

export const login = [
  body("email").isEmail().withMessage("email is invalid").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("password is required"),
  async (
    req: Request<{}, {}, LoginUserRequest>,
    res: Response<AuthResponse | ErrorResponse>
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = user.generateToken();
      res.json({ user: transformUser(user), token });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
];

export const getAllUsers = async (
  req: Request,
  res: Response<PaginationResponse<UserResponse> | ErrorResponse>
) => {
  const { page, limit } = getPaginationParams(req.query);

  try {
    const result = await User.findAndCountAll({
      offset: limit * page,
      limit: limit,
      order: [["createdAt", "DESC"]],
    });

    const transformedResult = {
      rows: result.rows.map((user) => transformUser(user)),
      count: result.count,
    };

    const response = generatePaginationResponse(transformedResult, page, limit);

    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response<UserResponse | ErrorResponse>
) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      res.status(200).json(transformUser(user));
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateUser = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("email is invalid")
    .normalizeEmail(),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage(
      "password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("name field is required"),
  body("role").optional().isString().isIn(["ADMIN", "USER"]),
  async (
    req: Request<{ id: string }, {}, UpdateUserRequest>,
    res: Response<UserResponse | ErrorResponse>
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, name, password, role } = req.body;
      const user = await User.findByPk(req.params.id);
      if (user) {
        if (email) {
          const userExist = await User.findOne({ where: { email } });
          if (userExist) {
            return res.status(400).json({ error: "Email in use" });
          }
          user.email = email;
        }

        if (password && req.user?.id === user.id) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(password, salt);
        }

        if (role && req.user?.role === "ADMIN") {
          user.role = role;
        }

        if (name) {
          user.name = name;
        }

        await user.save();
        res.status(200).json(transformUser(user));
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
];

export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      await user.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
