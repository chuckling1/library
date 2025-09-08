export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  email: string;
  message: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}
