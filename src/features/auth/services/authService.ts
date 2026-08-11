import { api } from '../../../core/api/client';
import { LoginRequest, RegisterRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordWithOtpRequest, AuthResponse, ApiResponse } from '../types/auth';

export const authService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/Auth/login', request);
    
    if (response.data && response.data.data) {
      const authData = response.data.data;
      sessionStorage.setItem('token', authData.accessToken);
      sessionStorage.setItem('refreshToken', authData.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(authData.user));
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
      sessionStorage.setItem('token', authData.accessToken);
      sessionStorage.setItem('refreshToken', authData.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('token', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));
      return authData;
    }

    throw new Error(response.data?.message || 'Đăng ký không thành công');
  },

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await api.post<ApiResponse<boolean>>('/Auth/change-password', request);
  },

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await api.post<ApiResponse<boolean>>('/Auth/forgot-password', request);
  },

  async resetPasswordWithOtp(request: ResetPasswordWithOtpRequest): Promise<void> {
    await api.post<ApiResponse<boolean>>('/Auth/reset-password-otp', request);
  },

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getStoredUser() {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return sessionStorage.getItem('token');
  }
};
