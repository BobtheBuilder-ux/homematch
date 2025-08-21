import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

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

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private notificationListeners: ((notification: NotificationData) => void)[] = [];
  private activityListeners: ((activity: ActivityData) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private propertyUpdateListeners: ((update: any) => void)[] = [];
  private applicationUpdateListeners: ((update: any) => void)[] = [];

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.homematch.ng'
      : 'http://localhost:3002';

    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.io server:', reason);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
      
      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
      this.handleReconnect();
    });

    // Real-time event listeners
    this.socket.on('new-notification', (notification: NotificationData) => {
      console.log('New notification received:', notification);
      
      // Show toast notification
      switch (notification.type) {
        case 'success':
          toast.success(notification.title, {
            description: notification.message,
          });
          break;
        case 'error':
          toast.error(notification.title, {
            description: notification.message,
          });
          break;
        case 'warning':
          toast.warning(notification.title, {
            description: notification.message,
          });
          break;
        default:
          toast.info(notification.title, {
            description: notification.message,
          });
      }
      
      // Notify listeners
      this.notificationListeners.forEach(listener => listener(notification));
    });

    this.socket.on('activity-update', (activity: ActivityData) => {
      console.log('New activity update:', activity);
      this.activityListeners.forEach(listener => listener(activity));
    });

    this.socket.on('property-update', (update: any) => {
      console.log('Property update received:', update);
      this.propertyUpdateListeners.forEach(listener => listener(update));
    });

    this.socket.on('application-update', (update: any) => {
      console.log('Application update received:', update);
      this.applicationUpdateListeners.forEach(listener => listener(update));
    });

    this.socket.on('system-announcement', (announcement: any) => {
      console.log('System announcement:', announcement);
      toast.info('System Announcement', {
        description: announcement.message,
        duration: 10000,
      });
    });

    this.socket.on('notification-marked-read', ({ notificationId }) => {
      console.log('Notification marked as read:', notificationId);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    }
  }

  // Room management
  joinPropertyRoom(propertyId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-property', propertyId);
    }
  }

  leavePropertyRoom(propertyId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-property', propertyId);
    }
  }

  joinApplicationRoom(applicationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-application', applicationId);
    }
  }

  leaveApplicationRoom(applicationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-application', applicationId);
    }
  }

  // Mark notification as read
  markNotificationAsRead(notificationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('mark-notification-read', notificationId);
    }
  }

  // Event listener management
  onNotification(listener: (notification: NotificationData) => void) {
    this.notificationListeners.push(listener);
    return () => {
      const index = this.notificationListeners.indexOf(listener);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  onActivity(listener: (activity: ActivityData) => void) {
    this.activityListeners.push(listener);
    return () => {
      const index = this.activityListeners.indexOf(listener);
      if (index > -1) {
        this.activityListeners.splice(index, 1);
      }
    };
  }

  onConnection(listener: (connected: boolean) => void) {
    this.connectionListeners.push(listener);
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  onPropertyUpdate(listener: (update: any) => void) {
    this.propertyUpdateListeners.push(listener);
    return () => {
      const index = this.propertyUpdateListeners.indexOf(listener);
      if (index > -1) {
        this.propertyUpdateListeners.splice(index, 1);
      }
    };
  }

  onApplicationUpdate(listener: (update: any) => void) {
    this.applicationUpdateListeners.push(listener);
    return () => {
      const index = this.applicationUpdateListeners.indexOf(listener);
      if (index > -1) {
        this.applicationUpdateListeners.splice(index, 1);
      }
    };
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // Getters
  get connected() {
    return this.isConnected;
  }

  get socketId() {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
export default socketService;