import { api } from './api';
import { Subject } from '../types/tutor';

export interface MyProfileData {
  userId: string;
  email: string;
  fullName: string;
  role: number;
  phone?: string | null;
  avatarUrl?: string | null;
  tutorProfile?: {
    bio?: string | null;
    qualifications?: string | null;
    isApproved: boolean;
    approvalStatus: number;
    defaultMeetingLink?: string | null;
    averageRating: number;
    totalSessions: number;
    subjects: Array<{
      subjectId: string;
      subjectName: string;
      proficiencyLevel: number;
      hourlyCredits: number;
    }>;
  } | null;
}

export interface UpdateUserProfileRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface UpdateTutorProfileRequest {
  bio?: string;
  qualifications?: string;
  defaultMeetingLink?: string;
}

export interface SubjectExperienceDto {
  subjectId: string;
  proficiencyLevel: number;
  hourlyCredits: number;
}

export const profileService = {
  async getMyProfile(): Promise<MyProfileData> {
    const res = await api.get<{ data: MyProfileData }>('/Profiles/me');
    return res.data.data;
  },

  async updateUserProfile(data: UpdateUserProfileRequest): Promise<boolean> {
    const res = await api.put<{ data: boolean }>('/Profiles/me', data);
    return res.data.data;
  },

  async updateTutorProfile(data: UpdateTutorProfileRequest): Promise<boolean> {
    const res = await api.put<{ data: boolean }>('/Profiles/tutor', data);
    return res.data.data;
  },

  async updateTutorSubjects(subjects: SubjectExperienceDto[]): Promise<boolean> {
    const res = await api.post<{ data: boolean }>('/Profiles/tutor/subjects', { subjects });
    return res.data.data;
  }
};
