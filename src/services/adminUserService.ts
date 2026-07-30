import { api } from './api';

export interface AdminUserDto {
  id: string;
  fullName: string;
  email: string;
  role: number; // 0=Admin, 1=Tutor, 2=Student
  isActive: boolean;
  creditBalance: number;
  createdAt: string;
  adminNote?: string;
  averageRating?: number;
  totalReviews?: number;
}

export interface PagedAdminUserResult {
  items: AdminUserDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const adminUserService = {
  async getUsers(params: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    role?: number;
    isActive?: boolean;
  }): Promise<PagedAdminUserResult> {
    const query = new URLSearchParams();
    if (params.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params.search) query.append('search', params.search);
    if (params.role !== undefined) query.append('role', params.role.toString());
    if (params.isActive !== undefined) query.append('isActive', params.isActive.toString());

    const res = await api.get(`/Admin/users?${query.toString()}`);
    return res.data.data;
  },

  async lockUser(userId: string): Promise<void> {
    await api.put(`/Admin/users/${userId}/lock`);
  },

  async unlockUser(userId: string): Promise<void> {
    await api.put(`/Admin/users/${userId}/unlock`);
  },

  async updateUserNote(userId: string, note: string | null): Promise<void> {
    await api.put(`/Admin/users/${userId}/note`, { note });
  },
};
