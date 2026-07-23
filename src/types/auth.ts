export enum UserRole {
  Student = 'Student',
  Tutor = 'Tutor',
  Admin = 'Admin',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole | string;
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
  role: string;
}
