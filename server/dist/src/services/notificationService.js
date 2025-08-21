"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class NotificationService {
    constructor(io) {
        this.io = io;
    }
    // Core notification creation
    createNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield prisma.notification.create({
                data: {
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    priority: data.priority || client_1.NotificationPriority.Medium,
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
        });
    }
    // Core activity feed creation
    createActivity(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const activity = yield prisma.activityFeed.create({
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
        });
    }
    // Property update notifications
    createPropertyUpdateNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const notifications = [];
            // Notify landlord
            const landlordNotification = yield this.createNotification({
                title: 'Property Updated',
                message: `Your property "${data.propertyName}" has been updated: ${data.updateType}`,
                type: client_1.NotificationType.PropertyUpdate,
                priority: client_1.NotificationPriority.Medium,
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
                    const tenantNotification = yield this.createNotification({
                        title: 'Property Update',
                        message: `The property "${data.propertyName}" has been updated: ${data.updateType}`,
                        type: client_1.NotificationType.PropertyUpdate,
                        priority: client_1.NotificationPriority.Medium,
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
            yield this.createActivity({
                type: client_1.ActivityType.PropertyUpdated,
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
        });
    }
    // Application status notifications
    createApplicationStatusNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const notifications = [];
            // Notify tenant
            const tenantNotification = yield this.createNotification({
                title: 'Application Status Update',
                message: `Your application for "${data.propertyName}" has been ${data.status.toLowerCase()}`,
                type: client_1.NotificationType.ApplicationStatus,
                priority: client_1.NotificationPriority.High,
                recipientId: data.tenantId,
                recipientType: 'tenant',
                relatedId: data.applicationId,
                relatedType: 'application',
                actionUrl: `/dashboard/applications/${data.applicationId}`,
                actionText: 'View Application'
            });
            notifications.push(tenantNotification);
            // Notify landlord
            const landlordNotification = yield this.createNotification({
                title: 'Application Updated',
                message: `Application from ${data.tenantName} for "${data.propertyName}" has been ${data.status.toLowerCase()}`,
                type: client_1.NotificationType.ApplicationStatus,
                priority: client_1.NotificationPriority.Medium,
                recipientId: data.landlordId,
                recipientType: 'landlord',
                relatedId: data.applicationId,
                relatedType: 'application',
                actionUrl: `/dashboard/applications/${data.applicationId}`,
                actionText: 'View Application'
            });
            notifications.push(landlordNotification);
            // Create activity feed entry
            const activityType = data.status === 'Approved' ? client_1.ActivityType.ApplicationApproved :
                data.status === 'Denied' ? client_1.ActivityType.ApplicationDenied :
                    client_1.ActivityType.ApplicationSubmitted;
            yield this.createActivity({
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
        });
    }
    // Payment notifications
    createPaymentNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.createNotification({
                title: 'Payment Due',
                message: `Your payment of ₦${data.amount.toLocaleString()} is due on ${data.dueDate.toLocaleDateString()}`,
                type: client_1.NotificationType.PaymentReminder,
                priority: client_1.NotificationPriority.High,
                recipientId: data.recipientId,
                recipientType: data.recipientType,
                relatedId: data.leaseId || data.propertyId,
                relatedType: data.leaseId ? 'lease' : 'property',
                actionUrl: `/dashboard/payments`,
                actionText: 'View Payment',
                expiresAt: data.dueDate
            });
            // Create activity feed entry
            yield this.createActivity({
                type: client_1.ActivityType.PaymentMade,
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
        });
    }
    // Inspection notifications
    createInspectionNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const notifications = [];
            // Notify tenant
            const tenantNotification = yield this.createNotification({
                title: 'Inspection Scheduled',
                message: `Your inspection for "${data.propertyName}" is scheduled for ${data.scheduledDate.toLocaleDateString()}`,
                type: client_1.NotificationType.InspectionScheduled,
                priority: client_1.NotificationPriority.High,
                recipientId: data.tenantId,
                recipientType: 'tenant',
                relatedId: data.inspectionId,
                relatedType: 'inspection',
                actionUrl: `/dashboard/inspections/${data.inspectionId}`,
                actionText: 'View Inspection'
            });
            notifications.push(tenantNotification);
            // Notify landlord
            const landlordNotification = yield this.createNotification({
                title: 'Inspection Scheduled',
                message: `Inspection for "${data.propertyName}" with ${data.tenantName} is scheduled for ${data.scheduledDate.toLocaleDateString()}`,
                type: client_1.NotificationType.InspectionScheduled,
                priority: client_1.NotificationPriority.Medium,
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
                const agentNotification = yield this.createNotification({
                    title: 'Inspection Assignment',
                    message: `You have been assigned an inspection for "${data.propertyName}" on ${data.scheduledDate.toLocaleDateString()}`,
                    type: client_1.NotificationType.InspectionScheduled,
                    priority: client_1.NotificationPriority.High,
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
            yield this.createActivity({
                type: client_1.ActivityType.InspectionScheduled,
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
        });
    }
    // Lease expiring notifications
    createLeaseExpiringNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const notifications = [];
            // Notify tenant
            const tenantNotification = yield this.createNotification({
                title: 'Lease Expiring Soon',
                message: `Your lease for "${data.propertyName}" expires on ${data.expiryDate.toLocaleDateString()}`,
                type: client_1.NotificationType.LeaseExpiring,
                priority: client_1.NotificationPriority.High,
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
            const landlordNotification = yield this.createNotification({
                title: 'Lease Expiring Soon',
                message: `Lease for "${data.propertyName}" with ${data.tenantName} expires on ${data.expiryDate.toLocaleDateString()}`,
                type: client_1.NotificationType.LeaseExpiring,
                priority: client_1.NotificationPriority.High,
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
        });
    }
    // Welcome notifications
    createWelcomeNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.createNotification({
                title: 'Welcome to HomeMatch!',
                message: `Welcome ${data.recipientName}! We're excited to have you on our platform.`,
                type: client_1.NotificationType.Welcome,
                priority: client_1.NotificationPriority.Medium,
                recipientId: data.recipientId,
                recipientType: data.recipientType,
                actionUrl: `/dashboard`,
                actionText: 'Explore Dashboard'
            });
            // Create activity feed entry
            const activityType = data.recipientType === 'tenant' ? client_1.ActivityType.TenantRegistered :
                data.recipientType === 'landlord' ? client_1.ActivityType.LandlordRegistered :
                    client_1.ActivityType.AgentAssigned;
            yield this.createActivity({
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
        });
    }
    // Utility methods
    markAsRead(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield prisma.notification.update({
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
        });
    }
    getUserNotifications(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 20, offset = 0) {
            return yield prisma.notification.findMany({
                where: {
                    recipientId: userId
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit,
                skip: offset
            });
        });
    }
    getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma.notification.count({
                where: {
                    recipientId: userId,
                    isRead: false
                }
            });
        });
    }
    getActivityFeed() {
        return __awaiter(this, arguments, void 0, function* (limit = 50, offset = 0, isPublic = true) {
            return yield prisma.activityFeed.findMany({
                where: {
                    isPublic: isPublic
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit,
                skip: offset
            });
        });
    }
    deleteExpiredNotifications() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            return yield prisma.notification.deleteMany({
                where: {
                    AND: [
                        { expiresAt: { not: null } },
                        { expiresAt: { lt: now } }
                    ]
                }
            });
        });
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
