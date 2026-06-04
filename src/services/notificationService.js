import api from '../api/axios';

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  respondToReschedule: async (id, status) => {
    const response = await api.post(`/notifications/${id}/respond`, { status });
    return response.data;
  }
};
