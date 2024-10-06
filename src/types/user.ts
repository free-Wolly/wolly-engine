export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "USER";
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: "ADMIN" | "USER";
}
