import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { auth } from '../auth';
import { databaseService } from '../utils/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: string;
  email?: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? [
              process.env.FRONTEND_URL || 'https://homematch.ng',
              'https://www.homematch.ng',
              'https://homematch.ng',
              /https:\/\/.*\.vercel\.app$/,
              /https:\/\/.*\.netlify\.app$/
            ]
          : true,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Validate session using BetterAuth
        const headers = new Headers();
        headers.set('authorization', `Bearer ${token}`);
        if (socket.handshake.headers.cookie) {
          headers.set('cookie', socket.handshake.headers.cookie as string);
        }
        
        const session = await auth.api.getSession({
          headers
        });

        if (!session || !session.user) {
          return next(new Error('Invalid or expired session'));
        }

        const userId = session.user.id;
        const userRole = session.user.role || 'tenant';
        const userEmail = session.user.email;
        
        // Fetch additional user details from database based on role
        let user: any = null;
        let userType = userRole;

        // Check based on role from BetterAuth
        if (userRole === 'tenant') {
          user = await databaseService.getClient().tenant.findFirst({
            where: { email: userEmail },
            select: { id: true, email: true, name: true },
          });
        } else if (userRole === 'landlord') {
          user = await databaseService.getClient().landlord.findFirst({
            where: { email: userEmail },
            select: { id: true, email: true, name: true },
          });
        } else if (userRole === 'agent') {
          user = await databaseService.getClient().agent.findFirst({
            where: { email: userEmail },
            select: { id: true, email: true, name: true },
          });
        } else if (userRole === 'admin') {
          user = await databaseService.getClient().admin.findFirst({
            where: { email: userEmail },
            select: { id: true, email: true, name: true },
          });
        }

        if (!user) {
          return next(new Error('User profile not found'));
        }

        socket.userId = userId;
        socket.userType = userType;
        socket.email = userEmail;
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);
      
      // Store user connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        
        // Join user-specific room
        socket.join(`user:${socket.userId}`);
        
        // Join role-specific rooms
        if (socket.userType) {
          socket.join(`role:${socket.userType}`);
        }
      }

      // Handle joining property-specific rooms
      socket.on('join-property', (propertyId: string) => {
        socket.join(`property:${propertyId}`);
        console.log(`User ${socket.userId} joined property room: ${propertyId}`);
      });

      // Handle leaving property-specific rooms
      socket.on('leave-property', (propertyId: string) => {
        socket.leave(`property:${propertyId}`);
        console.log(`User ${socket.userId} left property room: ${propertyId}`);
      });

      // Handle joining application-specific rooms
      socket.on('join-application', (applicationId: string) => {
        socket.join(`application:${applicationId}`);
        console.log(`User ${socket.userId} joined application room: ${applicationId}`);
      });

      // Handle leaving application-specific rooms
      socket.on('leave-application', (applicationId: string) => {
        socket.leave(`application:${applicationId}`);
        console.log(`User ${socket.userId} left application room: ${applicationId}`);
      });

      // Handle marking notifications as read
      socket.on('mark-notification-read', async (notificationId: string) => {
        try {
          await databaseService.getClient().notification.update({
            where: { id: parseInt(notificationId) },
            data: { isRead: true },
          });
          
          // Emit confirmation back to user
          socket.emit('notification-marked-read', { notificationId });
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });
    });

    console.log('Socket.IO server initialized');
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, notification: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('new-notification', notification);
    }
  }

  // Send notification to all users with specific role
  sendNotificationToRole(role: string, notification: any) {
    if (this.io) {
      this.io.to(`role:${role}`).emit('new-notification', notification);
    }
  }

  // Send notification to property-specific room
  sendNotificationToProperty(propertyId: string, notification: any) {
    if (this.io) {
      this.io.to(`property:${propertyId}`).emit('property-update', notification);
    }
  }

  // Send notification to application-specific room
  sendNotificationToApplication(applicationId: string, notification: any) {
    if (this.io) {
      this.io.to(`application:${applicationId}`).emit('application-update', notification);
    }
  }

  // Send activity feed update
  sendActivityUpdate(userId: string, activity: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('activity-update', activity);
    }
  }

  // Broadcast system-wide announcement
  broadcastAnnouncement(announcement: any) {
    if (this.io) {
      this.io.emit('system-announcement', announcement);
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get socket instance
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
export default socketService;