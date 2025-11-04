import axios from "axios";

const API_URL = 'http://localhost:8000';

export interface Notification {
  notification_id: number;
  task_id: number;
  user_id: number;
  type: 'overdue' | 'reminder';
  message: string;
  sent_at: string;
  is_read: boolean;
}

export interface CreateNotificationData {
  task_id: number;
  user_id: number;
  type: 'overdue' | 'reminder';
  message: string;
}

export async function getNotifications(userId?: number, isRead?: boolean): Promise<Notification[]> {
  const params: Record<string, string | number> = {};
  if (userId) params.user_id = userId;
  if (isRead !== undefined) params.is_read = isRead ? 'true' : 'false';
  
  const { data } = await axios.get(`${API_URL}/notifications/`, { params });
  return data;
}

export async function getNotification(notificationId: number): Promise<Notification> {
  const { data } = await axios.get(`${API_URL}/notifications/${notificationId}`);
  return data;
}

export async function createNotification(data: CreateNotificationData): Promise<Notification> {
  const { data: res } = await axios.post(`${API_URL}/notifications/`, data);
  return res;
}

export async function updateNotification(notificationId: number, isRead: boolean): Promise<Notification> {
  const { data } = await axios.put(`${API_URL}/notifications/${notificationId}`, { is_read: isRead });
  return data;
}

export async function deleteNotification(notificationId: number): Promise<void> {
  await axios.delete(`${API_URL}/notifications/${notificationId}`);
}

