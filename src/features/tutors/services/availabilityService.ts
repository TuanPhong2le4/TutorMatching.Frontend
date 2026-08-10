import { api } from '../../../core/api/client';

export interface AvailabilityDto {
  id: string;
  dayOfWeek?: number | null; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  isRecurring: boolean;
  specificDate?: string | null; // ISO DateTime string or Date string
}

export interface UpdateAvailabilityRequestItem {
  dayOfWeek?: number | null;
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  isRecurring: boolean;
  specificDate?: string | null;
}

export const availabilityService = {
  async getAvailabilities(tutorId: string): Promise<AvailabilityDto[]> {
    const res = await api.get<AvailabilityDto[]>(`/Availabilities/${tutorId}`);
    return res.data;
  },

  async updateMyAvailability(availabilities: UpdateAvailabilityRequestItem[]): Promise<boolean> {
    await api.put('/Availabilities/my-availability', availabilities);
    return true;
  }
};
