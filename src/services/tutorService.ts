import { api } from './api';
import { TutorSearchResult, Subject, SearchTutorsParams, PagedResult } from '../types/tutor';

export const tutorService = {
  // Search and filter tutors
  async searchTutors(params: SearchTutorsParams = {}): Promise<PagedResult<TutorSearchResult>> {
    const response = await api.get<{ data: PagedResult<TutorSearchResult> }>('/Tutors/search', { params });
    return response.data.data;
  },

  // Get tutor detail by ID
  async getTutorById(id: string): Promise<TutorSearchResult> {
    const response = await api.get<{ data: TutorSearchResult }>(`/Tutors/${id}`);
    return response.data.data;
  },

  // Get all active subjects for filtering
  async getAllSubjects(): Promise<Subject[]> {
    const response = await api.get<{ data: Subject[] }>('/Subjects');
    return response.data.data;
  }
};
