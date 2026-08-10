import { api } from '../../../core/api/client';
import { Subject } from '../types/tutor';
import { ApiResponse } from '../../auth/types/auth';

export interface CreateSubjectDto {
  name: string;
  description?: string;
}

export interface UpdateSubjectDto {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export const subjectService = {
  // Get all subjects (including inactive if requested)
  async getAll(includeInactive: boolean = true): Promise<Subject[]> {
    const response = await api.get<ApiResponse<Subject[]>>(`/Subjects?includeInactive=${includeInactive}`);
    return response.data.data || [];
  },

  // Create new subject
  async create(data: CreateSubjectDto): Promise<Subject> {
    const response = await api.post<ApiResponse<Subject>>('/Subjects', data);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Không thể tạo môn học mới');
  },

  // Update existing subject
  async update(id: string, data: UpdateSubjectDto): Promise<Subject> {
    const response = await api.put<ApiResponse<Subject>>(`/Subjects/${id}`, data);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Không thể cập nhật môn học');
  },

  // Deactivate / Lock subject (soft delete)
  async deleteOrLock(id: string): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/Subjects/${id}`);
    return response.data.data !== undefined ? response.data.data : response.data.success;
  },

  // Reactivate / Unlock subject
  async reactivate(id: string): Promise<Subject> {
    const response = await api.put<ApiResponse<Subject>>(`/Subjects/${id}/reactivate`);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Không thể mở khóa môn học');
  }
};
