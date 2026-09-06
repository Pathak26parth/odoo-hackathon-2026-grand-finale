import api from './api';

export const notificationService = {
  /**
   * Fetch all notifications for the current authenticated user
   */
  async getNotifications(params = {}) {
    const res = await api.get('/notifications', { params });
    return res?.data?.data || res?.data || res;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res?.data || res;
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead() {
    const res = await api.post('/notifications/mark-all-read');
    return res?.data || res;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id) {
    const res = await api.delete(`/notifications/${id}`);
    return res?.data || res;
  },

  /**
   * Create a new notification (optional)
   */
  async createNotification(payload) {
    const res = await api.post('/notifications', payload);
    return res?.data?.data || res?.data || res;
  }
};

export default notificationService;
