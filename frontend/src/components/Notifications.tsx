import { useState, useEffect, useCallback } from 'react';
import { getNotifications, updateNotification, deleteNotification, type Notification } from '../api/notifications';
import { formatDate } from '../utils/dateFormat';
import type { DateFormat } from '../utils/dateFormat';
import './Notifications.css';

interface NotificationsProps {
  userId: number;
  dateFormat?: DateFormat;
}

export function Notifications({ userId, dateFormat = 'DD/MM/YYYY' }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: Notification[];
      if (filter === 'unread') {
        data = await getNotifications(userId, false);
      } else if (filter === 'read') {
        data = await getNotifications(userId, true);
      } else {
        data = await getNotifications(userId);
      }
      setNotifications(data);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await updateNotification(notificationId, true);
      setNotifications(prev => 
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Ошибка отметки уведомления:', error);
    }
  };

  const handleMarkAsUnread = async (notificationId: number) => {
    try {
      await updateNotification(notificationId, false);
      setNotifications(prev => 
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: false } : n)
      );
    } catch (error) {
      console.error('Ошибка отметки уведомления:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="notifications-container">
        <div className="notifications-loading">
          <p>Загрузка уведомлений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1 className="notifications-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '10px' }}>
            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Уведомления
          {unreadCount > 0 && (
            <span className="notifications-badge">{unreadCount}</span>
          )}
        </h1>
      </div>

      <div className="notifications-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Непрочитанные ({notifications.filter(n => !n.is_read).length})
        </button>
        <button
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Прочитанные
        </button>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3, marginBottom: '16px' }}>
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>Нет уведомлений</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.notification_id}
              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                <div className="notification-icon">
                  {notification.type === 'overdue' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6V10L16 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="notification-text">
                  <p className="notification-message">{notification.message}</p>
                  <span className="notification-time">
                    {formatDate(new Date(notification.sent_at), dateFormat)}
                  </span>
                </div>
              </div>
              <div className="notification-actions">
                {notification.is_read ? (
                  <button
                    className="notification-action-btn"
                    onClick={() => handleMarkAsUnread(notification.notification_id)}
                    title="Отметить как непрочитанное"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12C1 12 5 4 12 4C16.5 4 20 7.5 20 12M23 12C23 12 19 20 12 20C7.5 20 4 16.5 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <button
                    className="notification-action-btn"
                    onClick={() => handleMarkAsRead(notification.notification_id)}
                    title="Отметить как прочитанное"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                <button
                  className="notification-action-btn delete-btn"
                  onClick={() => handleDelete(notification.notification_id)}
                  title="Удалить"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

