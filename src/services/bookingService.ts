import { api } from './api';

export interface BookingDto {
  id: string;
  tutorId: string;
  studentId: string;
  subjectId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: number;
  meetingLink?: string | null;
  creditAmount: number;
  studentName: string;
  tutorName: string;
  subjectName: string;
  isStudentReviewed?: boolean;
  isTutorReviewed?: boolean;
}

export interface PagedBookingResult {
  items: BookingDto[];
  totalCount: number;
}

export interface CreateBookingRequest {
  tutorId: string;
  subjectId: string;
  scheduledStartAt: string; // ISO String
  scheduledEndAt: string; // ISO String
  notes?: string;
}

export const bookingService = {
  async createBooking(data: CreateBookingRequest): Promise<string> {
    const res = await api.post<string>('/Bookings', data);
    return res.data;
  },

  async getMyBookings(pageNumber: number = 1, pageSize: number = 10): Promise<PagedBookingResult> {
    const res = await api.get<PagedBookingResult>('/Bookings/me', {
      params: { pageNumber, pageSize }
    });
    return res.data;
  },

  async confirmBooking(bookingId: string, meetingLink?: string): Promise<boolean> {
    await api.put(`/Bookings/${bookingId}/confirm`, { meetingLink });
    return true;
  },

  async updateMeetingLink(bookingId: string, meetingLink: string): Promise<boolean> {
    await api.put(`/Bookings/${bookingId}/meeting-link`, { meetingLink });
    return true;
  },

  async completeBooking(bookingId: string): Promise<boolean> {
    await api.put(`/Bookings/${bookingId}/complete`, {});
    return true;
  },

  async cancelBooking(bookingId: string, reason: string): Promise<boolean> {
    await api.put(`/Bookings/${bookingId}/cancel`, { reason });
    return true;
  }
};
