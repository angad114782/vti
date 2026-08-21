import api from './axios';
export interface AppNotification { id: string; title: string; message: string; entityType?: string; entityId?: string; readAt?: string; createdAt: string; }
export const notificationsApi = { list: () => api.get<{ notifications: AppNotification[]; unread: number }>('/notifications'), markRead: (id: string) => api.patch(`/notifications/${id}/read`) };
