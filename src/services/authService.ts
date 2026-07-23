import { api } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types/auth';

export const authService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/Auth/login', request);
    
    if (response.data && response.data.data) {
      const authData = response.data.data;
      localStorage.setItem('token', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));
      return authData;
    }
    
    throw new Error(response.data?.message || 'Đăng nhập không thành công');
  },

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/Auth/register', request);

    if (response.data && response.data.data) {
      const authData = response.data.data;
      localStorage.setItem('token', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));
      return authData;
    }

    throw new Error(response.data?.message || 'Đăng ký không thành công');
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getStoredUser() {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  }
};
