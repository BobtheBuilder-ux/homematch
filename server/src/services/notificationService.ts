import { PrismaClient, NotificationType, NotificationPriority, ActivityType } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  recipientId: string;
  recipientType: string;
  relatedId?: number;
  relatedType?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  expiresAt?: Date;
}

interface ActivityData {
  type: ActivityType;
  title: string;
  description: string;
  actorId: string;
  actorType: string;
  actorName: string;
  targetId?: number;
  targetType?: string;
  metadata?: any;
  isPublic?: boolean;
}

export class NotificationService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // Core notification creation
  async createNotification(data: NotificationData) {
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || NotificationPriority.Medium,
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        actionUrl: data.actionUrl,
        actionText: data.actionText,
        metadata: data.metadata,
        expiresAt: data.expiresAt
      }
    });

    // Emit real-time notification
    this.io.to(`user_${data.recipientId}`).emit('notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      createdAt: notification.createdAt
    });

    return notification;
  }

  // Core activity feed creation
  async createActivity(data: ActivityData) {
    const activity = await prisma.activityFeed.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        actorId: data.actorId,
        actorType: data.actorType,
        actorName: data.actorName,
        targetId: data.targetId,
        targetType: data.targetType,
        metadata: data.metadata,
        isPublic: data.isPublic || false
      }
    });

    // Emit real-time activity update
    this.io.emit('activity', {
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      actorName: activity.actorName,
      createdAt: activity.createdAt
    });

    return activity;
  }

  // Property update notifications
  async createPropertyUpdateNotification(data: {
    propertyId: number;
    propertyName: string;
    updateType: string;
    landlordId: string;
    tenantIds?: string[];
  }) {
    const notifications = [];

    // Notify landlord
    const landlordNotification = await this.createNotification({
      title: 'Property Updated',
      message: `Your property "${data.propertyName}" has been updated: ${data.updateType}`,
      type: NotificationType.PropertyUpdate,
      priority: NotificationPriority.Medium,
      recipientId: data.landlordId,
      recipientType: 'landlord',
      relatedId: data.propertyId,
      relatedType: 'property',
      actionUrl: `/dashboard/properties/${data.propertyId}`,
      actionText: 'View Property'
    });
    notifications.push(landlordNotification);

    // Notify tenants if any
    if (data.tenantIds && data.tenantIds.length > 0) {
      for (const tenantId of data.tenantIds) {
        const tenantNotification = await this.createNotification({
          title: 'Property Update',
          message: `The property "${data.propertyName}" has been updated: ${data.updateType}`,
          type: NotificationType.PropertyUpdate,
          priority: NotificationPriority.Medium,
          recipientId: tenantId,
          recipientType: 'tenant',
          relatedId: data.propertyId,
          relatedType: 'property',
          actionUrl: `/dashboard/properties/${data.propertyId}`,
          actionText: 'View Property'
        });
        notifications.push(tenantNotification);
      }
    }

    // Create activity feed entry
    await this.createActivity({
      type: ActivityType.PropertyUpdated,
      title: 'Property Updated',
      description: `Property "${data.propertyName}" was updated: ${data.updateType}`,
      actorId: data.landlordId,
      actorType: 'landlord',
      actorName: 'Landlord',
      targetId: data.propertyId,
      targetType: 'property',
      metadata: {
        updateType: data.updateType,
        propertyName: data.propertyName
      },
      isPublic: true
    });

    return notifications;
  }

  // Application status notifications
  async createApplicationStatusNotification(data: {
    applicationId: number;
    tenantId: string;
    landlordId: string;
    propertyName: string;
    status: string;
    tenantName: string;
  }) {
    const notifications = [];

    // Notify tenant
    const tenantNotification = await this.createNotification({
      title: 'Application Status Update',
      message: `Your application for "${data.propertyName}" has been ${data.status.toLowerCase()}`,
      type: NotificationType.ApplicationStatus,
      priority: NotificationPriority.High,
      recipientId: data.tenantId,
      recipientType: 'tenant',
      relatedId: data.applicationId,
      relatedType: 'application',
      actionUrl: `/dashboard/applications/${data.applicationId}`,
      actionText: 'View Application'
    });
    notifications.push(tenantNotification);

    // Notify landlord
    const landlordNotification = await this.createNotification({
      title: 'Application Updated',
      message: `Application from ${data.tenantName} for "${data.propertyName}" has been ${data.status.toLowerCase()}`,
      type: NotificationType.ApplicationStatus,
      priority: NotificationPriority.Medium,
      recipientId: data.landlordId,
      recipientType: 'landlord',
      relatedId: data.applicationId,
      relatedType: 'application',
      actionUrl: `/dashboard/applications/${data.applicationId}`,
      actionText: 'View Application'
    });
    notifications.push(landlordNotification);

    // Create activity feed entry
    const activityType = data.status === 'Approved' ? ActivityType.ApplicationApproved : 
                        data.status === 'Denied' ? ActivityType.ApplicationDenied : 
                        ActivityType.ApplicationSubmitted;

    await this.createActivity({
      type: activityType,
      title: `Application ${data.status}`,
      description: `Application from ${data.tenantName} for "${data.propertyName}" was ${data.status.toLowerCase()}`,
      actorId: data.landlordId,
      actorType: 'landlord',
      actorName: 'Landlord',
      targetId: data.applicationId,
      targetType: 'application',
      metadata: {
        tenantName: data.tenantName,
        propertyName: data.propertyName,
        status: data.status
      },
      isPublic: false
    });

    return notifications;
  }

  // Payment notifications
  async createPaymentNotification(data: {
    recipientId: string;
    recipientType: string;
    amount: number;
    dueDate: Date;
    propertyId?: number;
    leaseId?: number;
  }) {
    const notification = await this.createNotification({
      title: 'Payment Due',
      message: `Your payment of ₦${data.amount.toLocaleString()} is due on ${data.dueDate.toLocaleDateString()}`,
      type: NotificationType.PaymentReminder,
      priority: NotificationPriority.High,
      recipientId: data.recipientId,
      recipientType: data.recipientType,
      relatedId: data.leaseId || data.propertyId,
      relatedType: data.leaseId ? 'lease' : 'property',
      actionUrl: `/dashboard/payments`,
      actionText: 'View Payment',
      expiresAt: data.dueDate
    });

    // Create activity feed entry
    await this.createActivity({
      type: ActivityType.PaymentMade,
      title: 'Payment Due',
      description: `Payment of ₦${data.amount.toLocaleString()} is due`,
      actorId: 'system',
      actorType: 'system',
      actorName: 'System',
      targetId: data.leaseId || data.propertyId,
      targetType: data.leaseId ? 'lease' : 'property',
      metadata: {
        amount: data.amount,
        dueDate: data.dueDate,
        currency: 'NGN'
      }
    });

    return notification;
  }

  // Inspection notifications
  async createInspectionNotification(data: {
    inspectionId: number;
    tenantId: string;
    landlordId: string;
    agentId?: string;
    propertyName: string;
    scheduledDate: Date;
    tenantName: string;
  }) {
    const notifications = [];

    // Notify tenant
    const tenantNotification = await this.createNotification({
      title: 'Inspection Scheduled',
      message: `Your inspection for "${data.propertyName}" is scheduled for ${data.scheduledDate.toLocaleDateString()}`,
      type: NotificationType.InspectionScheduled,
      priority: NotificationPriority.High,
      recipientId: data.tenantId,
      recipientType: 'tenant',
      relatedId: data.inspectionId,
      relatedType: 'inspection',
      actionUrl: `/dashboard/inspections/${data.inspectionId}`,
      actionText: 'View Inspection'
    });
    notifications.push(tenantNotification);

    // Notify landlord
    const landlordNotification = await this.createNotification({
      title: 'Inspection Scheduled',
      message: `Inspection for "${data.propertyName}" with ${data.tenantName} is scheduled for ${data.scheduledDate.toLocaleDateString()}`,
      type: NotificationType.InspectionScheduled,
      priority: NotificationPriority.Medium,
      recipientId: data.landlordId,
      recipientType: 'landlord',
      relatedId: data.inspectionId,
      relatedType: 'inspection',
      actionUrl: `/dashboard/inspections/${data.inspectionId}`,
      actionText: 'View Inspection'
    });
    notifications.push(landlordNotification);

    // Notify agent if assigned
    if (data.agentId) {
      const agentNotification = await this.createNotification({
        title: 'Inspection Assignment',
        message: `You have been assigned an inspection for "${data.propertyName}" on ${data.scheduledDate.toLocaleDateString()}`,
        type: NotificationType.InspectionScheduled,
        priority: NotificationPriority.High,
        recipientId: data.agentId,
        recipientType: 'agent',
        relatedId: data.inspectionId,
        relatedType: 'inspection',
        actionUrl: `/dashboard/inspections/${data.inspectionId}`,
        actionText: 'View Inspection'
      });
      notifications.push(agentNotification);
    }

    // Create activity feed entry
    await this.createActivity({
      type: ActivityType.InspectionScheduled,
      title: 'Inspection Scheduled',
      description: `Inspection for "${data.propertyName}" scheduled with ${data.tenantName}`,
      actorId: data.tenantId,
      actorType: 'tenant',
      actorName: data.tenantName,
      targetId: data.inspectionId,
      targetType: 'inspection',
      metadata: {
        propertyName: data.propertyName,
        scheduledDate: data.scheduledDate
      },
      isPublic: false
    });

    return notifications;
  }

  // Lease expiring notifications
  async createLeaseExpiringNotification(data: {
    leaseId: number;
    tenantId: string;
    landlordId: string;
    propertyName: string;
    expiryDate: Date;
    tenantName: string;
  }) {
    const notifications = [];

    // Notify tenant
    const tenantNotification = await this.createNotification({
      title: 'Lease Expiring Soon',
      message: `Your lease for "${data.propertyName}" expires on ${data.expiryDate.toLocaleDateString()}`,
      type: NotificationType.LeaseExpiring,
      priority: NotificationPriority.High,
      recipientId: data.tenantId,
      recipientType: 'tenant',
      relatedId: data.leaseId,
      relatedType: 'lease',
      actionUrl: `/dashboard/leases/${data.leaseId}`,
      actionText: 'View Lease',
      expiresAt: data.expiryDate
    });
    notifications.push(tenantNotification);

    // Notify landlord
    const landlordNotification = await this.createNotification({
      title: 'Lease Expiring Soon',
      message: `Lease for "${data.propertyName}" with ${data.tenantName} expires on ${data.expiryDate.toLocaleDateString()}`,
      type: NotificationType.LeaseExpiring,
      priority: NotificationPriority.High,
      recipientId: data.landlordId,
      recipientType: 'landlord',
      relatedId: data.leaseId,
      relatedType: 'lease',
      actionUrl: `/dashboard/leases/${data.leaseId}`,
      actionText: 'View Lease',
      expiresAt: data.expiryDate
    });
    notifications.push(landlordNotification);

    return notifications;
  }

  // Welcome notifications
  async createWelcomeNotification(data: {
    recipientId: string;
    recipientType: string;
    recipientName: string;
  }) {
    const notification = await this.createNotification({
      title: 'Welcome to HomeMatch!',
      message: `Welcome ${data.recipientName}! We're excited to have you on our platform.`,
      type: NotificationType.Welcome,
      priority: NotificationPriority.Medium,
      recipientId: data.recipientId,
      recipientType: data.recipientType,
      actionUrl: `/dashboard`,
      actionText: 'Explore Dashboard'
    });

    // Create activity feed entry
    const activityType = data.recipientType === 'tenant' ? ActivityType.TenantRegistered : 
                        data.recipientType === 'landlord' ? ActivityType.LandlordRegistered : 
                        ActivityType.AgentAssigned;

    await this.createActivity({
      type: activityType,
      title: `New ${data.recipientType} joined`,
      description: `${data.recipientName} joined as a ${data.recipientType}`,
      actorId: data.recipientId,
      actorType: data.recipientType,
      actorName: data.recipientName,
      metadata: {
        userType: data.recipientType
      },
      isPublic: true
    });

    return notification;
  }

  // Utility methods
  async markAsRead(notificationId: number, userId: string) {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        recipientId: userId
      },
      data: {
        isRead: true
      }
    });

    // Emit real-time update
    this.io.to(`user_${userId}`).emit('notification_read', {
      notificationId: notificationId
    });

    return notification;
  }

  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0) {
    return await prisma.notification.findMany({
      where: {
        recipientId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });
  }

  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    });
  }

  async getActivityFeed(limit: number = 50, offset: number = 0, isPublic: boolean = true) {
    return await prisma.activityFeed.findMany({
      where: {
        isPublic: isPublic
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });
  }

  async deleteExpiredNotifications() {
    const now = new Date();
    return await prisma.notification.deleteMany({
      where: {
        AND: [
          { expiresAt: { not: null } },
          { expiresAt: { lt: now } }
        ]
      }
    });
  }
}

export default NotificationService;