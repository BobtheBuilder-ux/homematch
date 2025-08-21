import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationData } from '@/services/notificationService';
import { useGetAuthUserQuery } from '@/state/api';

export interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { data: authUser } = useGetAuthUserQuery();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to notification service updates
  useEffect(() => {
    if (!authUser?.cognitoInfo?.userId) return;

    const unsubscribeNotifications = notificationService.onNotificationsChange((newNotifications) => {
      setNotifications(newNotifications);
    });

    const unsubscribeUnreadCount = notificationService.onUnreadCountChange((count) => {
      setUnreadCount(count);
    });

    // Initialize with current data
    setNotifications(notificationService.currentNotifications);
    setUnreadCount(notificationService.currentUnreadCount);

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [authUser?.cognitoInfo?.userId]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (page: number = 1, limit: number = 20) => {
    if (!authUser?.cognitoInfo?.userId) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await notificationService.fetchNotifications(page, limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.cognitoInfo?.userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    if (!authUser?.cognitoInfo?.userId) {
      setError('User not authenticated');
      return;
    }

    try {
      await notificationService.markAsRead(notificationId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      console.error('Error marking notification as read:', err);
    }
  }, [authUser?.cognitoInfo?.userId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!authUser?.cognitoInfo?.userId) {
      setError('User not authenticated');
      return;
    }

    try {
      await notificationService.markAllAsRead();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(errorMessage);
      console.error('Error marking all notifications as read:', err);
    }
  }, [authUser?.cognitoInfo?.userId]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    if (!authUser?.cognitoInfo?.userId) {
      setError('User not authenticated');
      return;
    }

    try {
      await notificationService.deleteNotification(notificationId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      setError(errorMessage);
      console.error('Error deleting notification:', err);
    }
  }, [authUser?.cognitoInfo?.userId]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!authUser?.cognitoInfo?.userId) {
      setError('User not authenticated');
      return;
    }

    try {
      await notificationService.getUnreadCount();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh unread count';
      setError(errorMessage);
      console.error('Error refreshing unread count:', err);
    }
  }, [authUser?.cognitoInfo?.userId]);

  // Initial fetch when user is authenticated
  useEffect(() => {
    if (authUser?.cognitoInfo?.userId) {
      fetchNotifications();
      refreshUnreadCount();
    }
  }, [authUser?.cognitoInfo?.userId, fetchNotifications, refreshUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount
  };
};

export default useNotifications;