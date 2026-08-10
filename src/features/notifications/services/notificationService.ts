import { api } from '../../../core/api/client';
import { PagedNotificationResult } from '../types/notification';

export const notificationService = {
  // Fetch notification history
  async getNotifications(pageNumber = 1, pageSize = 10): Promise<PagedNotificationResult> {
    const response = await api.get<{ data: PagedNotificationResult }>('/Notifications', {
      params: { pageNumber, pageSize },
    });
    return response.data.data;
  },

  // Fetch count of unread notifications
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ data: number }>('/Notifications/unread-count');
    return response.data.data;
  },

  // Mark single notification as read
  async markAsRead(id: string): Promise<boolean> {
    const response = await api.put<{ data: boolean }>(`/Notifications/${id}/read`);
    return response.data.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<boolean> {
    const response = await api.put<{ data: boolean }>('/Notifications/read-all');
    return response.data.data;
  },
};
