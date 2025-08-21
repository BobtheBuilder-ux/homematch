import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
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

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Fetch user details from database - check all user types
        const cognitoId = decoded.sub;
        let user: any = null;
        let userType = '';

        // Check Tenant
        const tenant = await databaseService.getClient().tenant.findUnique({
          where: { cognitoId },
          select: { cognitoId: true, email: true, name: true },
        });
        if (tenant) {
          user = tenant;
          userType = 'tenant';
        }

        // Check Landlord
        if (!user) {
          const landlord = await databaseService.getClient().landlord.findUnique({
            where: { cognitoId },
            select: { cognitoId: true, email: true, name: true },
          });
          if (landlord) {
            user = landlord;
            userType = 'landlord';
          }
        }

        // Check Agent
        if (!user) {
          const agent = await databaseService.getClient().agent.findUnique({
            where: { cognitoId },
            select: { cognitoId: true, email: true, name: true },
          });
          if (agent) {
            user = agent;
            userType = 'agent';
          }
        }

        // Check Admin
        if (!user) {
          const admin = await databaseService.getClient().admin.findUnique({
            where: { cognitoId },
            select: { cognitoId: true, email: true, name: true },
          });
          if (admin) {
            user = admin;
            userType = 'admin';
          }
        }

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.cognitoId;
        socket.userType = userType;
        socket.email = user.email;
        
        next();
      } catch (error) {
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