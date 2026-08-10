export interface TutorSubject {
  subjectId: string;
  subjectName: string;
  proficiencyLevel: number;
  hourlyCredits: number;
}

export interface TutorSearchResult {
  tutorId: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  qualifications?: string | null;
  averageRating: number;
  totalReviews: number;
  totalSessions: number;
  phone?: string | null;
  email?: string | null;
  defaultMeetingLink?: string | null;
  subjects: TutorSubject[];
}

export interface Subject {
  id: string;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
}

export interface SearchTutorsParams {
  searchTerm?: string;
  subjectId?: string;
  minRating?: number;
  sortBy?: string;
  minHourlyCredits?: number;
  maxHourlyCredits?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
