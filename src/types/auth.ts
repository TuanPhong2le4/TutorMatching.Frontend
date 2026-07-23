export enum UserRole {
  Admin = 0,
  Tutor = 1,
  Student = 2,
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole | number | string;
  creditsBalance?: number;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: number;
}
