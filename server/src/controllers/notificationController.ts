import { Request, Response } from 'express';
import { databaseService } from '../utils/database';
import NotificationService from '../services/notificationService';
import { socketService } from '../services/socketService';

const prisma = databaseService.getClient();

// Initialize notification service with socket.io (lazy initialization)
let notificationService: NotificationService | null = null;

function getNotificationService(): NotificationService {
  if (!notificationService && socketService.getIO()) {
    notificationService = new NotificationService(socketService.getIO()!);
  }
  return notificationService!;
}

export const notificationController = {
  // Get user notifications with pagination
  async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const notifications = await prisma.notification.findMany({
        where: {
          recipientId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      const totalCount = await prisma.notification.count({
        where: {
          recipientId: userId
        }
      });

      const unreadCount = await prisma.notification.count({
        where: {
          recipientId: userId,
          isRead: false
        }
      });

      res.json({
        notifications,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  },

  // Get unread notification count
  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const unreadCount = await prisma.notification.count({
        where: {
          recipientId: userId,
          isRead: false
        }
      });

      res.json({ unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  },

  // Mark notification as read
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const notificationId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          recipientId: userId // Ensure user can only mark their own notifications
        },
        data: {
          isRead: true
        }
      });

      // Emit real-time update
      if (socketService.getIO()) {
        socketService.getIO()!.to(`user_${userId}`).emit('notification_read', {
          notificationId: notificationId
        });
      }

      res.json({ message: 'Notification marked as read', notification });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      // Emit real-time update
      if (socketService.getIO()) {
        socketService.getIO()!.to(`user_${userId}`).emit('all_notifications_read');
      }

      res.json({ 
        message: 'All notifications marked as read', 
        updatedCount: result.count 
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  },

  // Delete notification
  async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const notificationId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      await prisma.notification.delete({
        where: {
          id: notificationId,
          recipientId: userId // Ensure user can only delete their own notifications
        }
      });

      res.json({ message: 'Notification deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  },

  // Get activity feed (public activities) - temporarily disabled due to type issues
  async getActivityFeed(req: Request, res: Response) {
    try {
      // TODO: Fix ActivityFeed type issues
      res.json({
        activities: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0
        }
      });
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
  },

  // Create notification (admin/system use)
  async createNotification(req: Request, res: Response) {
    try {
      const {
        title,
        message,
        type,
        priority,
        recipientId,
        recipientType,
        relatedId,
        relatedType,
        actionUrl,
        actionText,
        metadata,
        expiresAt
      } = req.body;

      // Validate required fields
      if (!title || !message || !type || !recipientId || !recipientType) {
        return res.status(400).json({ 
          error: 'Missing required fields: title, message, type, recipientId, recipientType' 
        });
      }

      // Create notification using service if available
      let notification;
      const service = getNotificationService();
      if (service) {
        notification = await service.createNotification({
          title,
          message,
          type,
          priority,
          recipientId,
          recipientType,
          relatedId,
          relatedType,
          actionUrl,
          actionText,
          metadata,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined
        });
      } else {
        // Fallback to direct database creation
        notification = await prisma.notification.create({
          data: {
            title,
            message,
            type,
            recipientId,
            recipientType,
            relatedId,
            relatedType,
            actionUrl,
            actionText,
            metadata,
            expiresAt: expiresAt ? new Date(expiresAt) : null
          }
        });
      }

      res.status(201).json({ 
        message: 'Notification created successfully', 
        notification 
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Failed to create notification' });
    }
  },

  // Clean up expired notifications
  async cleanupExpired(req: Request, res: Response) {
    try {
      const now = new Date();
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            not: null,
            lt: now
          }
        }
      });

      res.json({ 
        message: 'Expired notifications cleaned up', 
        deletedCount: result.count 
      });
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      res.status(500).json({ error: 'Failed to cleanup expired notifications' });
    }
  }
};

export default notificationController;