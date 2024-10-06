import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";

interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (
  req: Request,
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
      process.env.JWT_SECRET || "your-secret-key"
    ) as JwtPayload;
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

export const extractUser = async (
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
    process.env.JWT_SECRET || "your-secret-key"
  ) as JwtPayload;

  const user = await User.findByPk(decoded.id);

  if (!user) {
    return next();
  }

  req.user = user;
  next();
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    res.status(403).send({ error: "Access denied. Admin rights required." });
  }
};

export const authorizeUserOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    req.user &&
    (req.user.role === "ADMIN" || req.user.id.toString() === req.params.id)
  ) {
    next();
  } else {
    res.status(403).send({
      error: "Access denied. You can only access your own information.",
    });
  }
};
