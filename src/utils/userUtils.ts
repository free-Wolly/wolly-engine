import User from "../models/user";
import { UserResponse } from "../types/user";

export const transformUser = (user: User): UserResponse => {
  const userJSON = user.toJSON();
  return {
    id: userJSON.id,
    name: userJSON.name,
    email: userJSON.email,
    role: userJSON.role,
    createdAt: userJSON.createdAt.toISOString(),
    updatedAt: userJSON.updatedAt.toISOString(),
  };
};
