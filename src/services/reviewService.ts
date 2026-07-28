import { api } from './api';

export interface ReviewDto {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  reviewType: string; // "StudentToTutor" or "TutorToStudent"
  subjectName: string;
  createdAt: string;
}

export interface AdminReviewDto {
  id: string;
  reviewerName: string;
  revieweeName: string;
  subjectName: string;
  rating: number;
  comment?: string;
  reviewType: number; // 0 = StudentToTutor, 1 = TutorToStudent
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export const reviewService = {
  async createReview(bookingId: string, rating: number, comment?: string): Promise<string> {
    const res = await api.post<{ data: string }>('/Reviews', {
      bookingId,
      rating,
      comment
    });
    return res.data.data;
  },

  async getReviews(userId: string, pageNumber = 1, pageSize = 10): Promise<PagedResult<ReviewDto>> {
    const res = await api.get<{ data: PagedResult<ReviewDto> }>(`/Reviews/${userId}`, {
      params: { pageNumber, pageSize }
    });
    return res.data.data;
  },

  async deleteReview(id: string): Promise<boolean> {
    const res = await api.delete<{ data: boolean }>(`/Reviews/${id}`);
    return res.data.data;
  },

  // Admin reviews management
  async getAllReviews(pageNumber = 1, pageSize = 20, search?: string, reviewType?: number, rating?: number): Promise<PagedResult<AdminReviewDto>> {
    const res = await api.get<{ data: PagedResult<AdminReviewDto> }>('/Admin/reviews', {
      params: { pageNumber, pageSize, search, reviewType, rating }
    });
    return res.data.data;
  }
};
