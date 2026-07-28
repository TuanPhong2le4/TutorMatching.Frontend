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
  }
};
