import { useEffect, useState, useCallback } from 'react';
import { useGetAuthUserQuery } from '@/state/api';
import { socketService } from '@/services/socketService';
import { getSession } from '@/lib/auth-client';

interface NotificationData {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface ActivityData {
  id: number;
  type: string;
  title: string;
  description: string;
  userId: string;
  createdAt: string;
  data?: any;
}

export const useSocket = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      if (authUser?.cognitoInfo?.id) {
        try {
          // Get the authentication token from BetterAuth
          const session = await getSession();
          
          if (session?.data?.session?.token) {
            // Initialize socket connection with auth token
            socketService.connect(session.data.session.token);

            // Set up connection listener
            const unsubscribeConnection = socketService.onConnection((connected) => {
              setIsConnected(connected);
            });

            // Set up notification listener
            const unsubscribeNotification = socketService.onNotification((notification) => {
              setNotifications(prev => [notification, ...prev]);
              if (!notification.isRead) {
                setUnreadCount(prev => prev + 1);
              }
            });

            // Set up activity listener
            const unsubscribeActivity = socketService.onActivity((activity) => {
              setActivities(prev => [activity, ...prev]);
            });

            // Store cleanup functions for later use
            return () => {
              unsubscribeConnection();
              unsubscribeNotification();
              unsubscribeActivity();
              socketService.disconnect();
            };
          }
        } catch (error) {
          console.error('Failed to initialize socket connection:', error);
        }
      }
    };

    initializeSocket();
  }, [authUser?.cognitoInfo?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Methods for interacting with socket
  const joinPropertyRoom = (propertyId: number) => {
    socketService.joinPropertyRoom(propertyId.toString());
  };

  const leavePropertyRoom = (propertyId: number) => {
    socketService.leavePropertyRoom(propertyId.toString());
  };

  const joinApplicationRoom = (applicationId: number) => {
    socketService.joinApplicationRoom(applicationId.toString());
  };

  const leaveApplicationRoom = (applicationId: number) => {
    socketService.leaveApplicationRoom(applicationId.toString());
  };

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    isConnected,
    notifications,
    activities,
    unreadCount,
    joinPropertyRoom,
    leavePropertyRoom,
    joinApplicationRoom,
    leaveApplicationRoom,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  };
};

export default useSocket;