import { Request, Response } from "express";
import User from "../models/user";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.create({ email, passwordHash: password, role });
    const token = user.generateToken();
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = user.generateToken();
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (user) {
      user.email = email || user.email;
      if (password) {
        user.passwordHash = password;
      }
      // Only allow admin to change role
      if (role && req.user?.role === "ADMIN") {
        user.role = role;
      }
      await user.save();
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      await user.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
