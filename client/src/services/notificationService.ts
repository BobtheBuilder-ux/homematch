import { toast } from 'sonner';
import { socketService } from './socketService';

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  type: 'PropertyUpdate' | 'ApplicationStatus' | 'PaymentReminder' | 'InspectionScheduled' | 'LeaseExpiring' | 'MaintenanceRequest' | 'SystemAlert' | 'Welcome' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  isRead: boolean;
  recipientId: string;
  recipientType: string;
  relatedId?: number;
  relatedType?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityData {
  id: number;
  type: string;
  title: string;
  description: string;
  actorId: string;
  actorType: string;
  actorName: string;
  targetId?: number;
  targetType?: string;
  metadata?: any;
  isPublic: boolean;
  createdAt: string;
}

class NotificationService {
  private baseUrl: string;
  private notifications: NotificationData[] = [];
  private unreadCount: number = 0;
  private listeners: {
    notifications: ((notifications: NotificationData[]) => void)[];
    unreadCount: ((count: number) => void)[];
    newNotification: ((notification: NotificationData) => void)[];
  } = {
    notifications: [],
    unreadCount: [],
    newNotification: []
  };

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.homematch.ng'
      : 'http://localhost:3001';
    
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // Listen for new notifications from socket
    socketService.onNotification((notification: any) => {
      this.handleNewNotification(notification);
    });
  }

  private handleNewNotification(notification: NotificationData) {
    // Add to notifications list
    this.notifications.unshift(notification);
    
    // Update unread count if not read
    if (!notification.isRead) {
      this.unreadCount++;
      this.notifyUnreadCountListeners();
    }
    
    // Show toast notification
    this.showToastNotification(notification);
    
    // Notify listeners
    this.notifyNotificationListeners();
    this.notifyNewNotificationListeners(notification);
  }

  private showToastNotification(notification: NotificationData) {
    const toastOptions = {
      duration: this.getToastDuration(notification.priority),
      action: notification.actionUrl ? {
        label: notification.actionText || 'View',
        onClick: () => {
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
        }
      } : undefined
    };

    switch (notification.priority) {
      case 'Urgent':
        toast.error(notification.message, {
          ...toastOptions,
          description: notification.title
        });
        break;
      case 'High':
        toast.warning(notification.message, {
          ...toastOptions,
          description: notification.title
        });
        break;
      case 'Medium':
        toast.info(notification.message, {
          ...toastOptions,
          description: notification.title
        });
        break;
      case 'Low':
      default:
        toast(notification.message, {
          ...toastOptions,
          description: notification.title
        });
        break;
    }
  }

  private getToastDuration(priority: string): number {
    switch (priority) {
      case 'Urgent': return 10000; // 10 seconds
      case 'High': return 7000;    // 7 seconds
      case 'Medium': return 5000;  // 5 seconds
      case 'Low': return 3000;     // 3 seconds
      default: return 5000;
    }
  }

  // API Methods
  async fetchNotifications(page: number = 1, limit: number = 20): Promise<{
    notifications: NotificationData[];
    pagination: { page: number; limit: number; total: number; pages: number };
    unreadCount: number;
  }> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/notifications?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      // Update local state
      if (page === 1) {
        this.notifications = data.notifications;
        this.unreadCount = data.unreadCount;
        this.notifyNotificationListeners();
        this.notifyUnreadCountListeners();
      }

      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      this.unreadCount = data.unreadCount;
      this.notifyUnreadCountListeners();
      
      return data.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
      if (notificationIndex !== -1 && !this.notifications[notificationIndex].isRead) {
        this.notifications[notificationIndex].isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notifyNotificationListeners();
        this.notifyUnreadCountListeners();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
      this.unreadCount = 0;
      this.notifyNotificationListeners();
      this.notifyUnreadCountListeners();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
      if (notificationIndex !== -1) {
        const wasUnread = !this.notifications[notificationIndex].isRead;
        this.notifications.splice(notificationIndex, 1);
        if (wasUnread) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.notifyUnreadCountListeners();
        }
        this.notifyNotificationListeners();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  private async getAuthToken(): Promise<string> {
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      
      if (!idToken) {
        throw new Error('No authentication token available');
      }
      
      return idToken.toString();
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Authentication required');
    }
  }

  // Event Listeners
  onNotificationsChange(listener: (notifications: NotificationData[]) => void): () => void {
    this.listeners.notifications.push(listener);
    return () => {
      const index = this.listeners.notifications.indexOf(listener);
      if (index > -1) {
        this.listeners.notifications.splice(index, 1);
      }
    };
  }

  onUnreadCountChange(listener: (count: number) => void): () => void {
    this.listeners.unreadCount.push(listener);
    return () => {
      const index = this.listeners.unreadCount.indexOf(listener);
      if (index > -1) {
        this.listeners.unreadCount.splice(index, 1);
      }
    };
  }

  onNewNotification(listener: (notification: NotificationData) => void): () => void {
    this.listeners.newNotification.push(listener);
    return () => {
      const index = this.listeners.newNotification.indexOf(listener);
      if (index > -1) {
        this.listeners.newNotification.splice(index, 1);
      }
    };
  }

  private notifyNotificationListeners() {
    this.listeners.notifications.forEach(listener => listener([...this.notifications]));
  }

  private notifyUnreadCountListeners() {
    this.listeners.unreadCount.forEach(listener => listener(this.unreadCount));
  }

  private notifyNewNotificationListeners(notification: NotificationData) {
    this.listeners.newNotification.forEach(listener => listener(notification));
  }

  // Getters
  get currentNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  get currentUnreadCount(): number {
    return this.unreadCount;
  }
}

export const notificationService = new NotificationService();
export default notificationService;