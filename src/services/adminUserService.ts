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

export interface AdminPopularSubjectDto {
  subjectId: string;
  subjectName: string;
  bookingCount: number;
}

export interface AdminRecentBookingDto {
  bookingId: string;
  tutorName: string;
  studentName: string;
  subjectName: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  creditAmount: number;
  status: string;
}

export interface AdminDashboardDto {
  totalUsers: number;
  totalTutors: number;
  totalStudents: number;
  pendingTutors: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: number;
  popularSubjects: AdminPopularSubjectDto[];
  goalCompletionRate: number;
  recentBookings: AdminRecentBookingDto[];
  totalRevenue: number;
}

export interface PendingTutorDto {
  userId: string;
  fullName: string;
  email: string;
  bio: string;
  qualifications: string;
  createdAt: string;
}

export interface PagedPendingTutorsResult {
  items: PendingTutorDto[];
  totalCount: number;
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

  async getDashboard(): Promise<AdminDashboardDto> {
    const res = await api.get<{ data: AdminDashboardDto }>('/Admin/dashboard');
    return res.data.data;
  },

  async getPendingTutors(pageNumber: number = 1, pageSize: number = 10): Promise<PagedPendingTutorsResult> {
    const res = await api.get<{ data: PagedPendingTutorsResult }>('/Admin/pending-tutors', {
      params: { pageNumber, pageSize }
    });
    return res.data.data;
  },

  async approveTutor(tutorId: string): Promise<void> {
    await api.put(`/Admin/tutors/${tutorId}/approve`);
  },

  async rejectTutor(tutorId: string): Promise<void> {
    await api.put(`/Admin/tutors/${tutorId}/reject`);
  }
};
