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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const database_1 = require("../utils/database");
const notificationService_1 = __importDefault(require("../services/notificationService"));
const socketService_1 = require("../services/socketService");
const prisma = database_1.databaseService.getClient();
// Initialize notification service with socket.io (lazy initialization)
let notificationService = null;
function getNotificationService() {
    if (!notificationService) {
        const io = socketService_1.socketService.getIO();
        if (!io) {
            throw new Error('Socket.IO server not initialized. Please ensure socketService.initialize() is called before using notifications.');
        }
        notificationService = new notificationService_1.default(io);
    }
    return notificationService;
}
exports.notificationController = {
    // Get user notifications with pagination
    getUserNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 20;
                const offset = (page - 1) * limit;
                const notifications = yield prisma.notification.findMany({
                    where: {
                        recipientId: userId
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: limit,
                    skip: offset
                });
                const totalCount = yield prisma.notification.count({
                    where: {
                        recipientId: userId
                    }
                });
                const unreadCount = yield prisma.notification.count({
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
            }
            catch (error) {
                console.error('Error fetching notifications:', error);
                res.status(500).json({ error: 'Failed to fetch notifications' });
            }
        });
    },
    // Get unread notification count
    getUnreadCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                const unreadCount = yield prisma.notification.count({
                    where: {
                        recipientId: userId,
                        isRead: false
                    }
                });
                res.json({ unreadCount });
            }
            catch (error) {
                console.error('Error fetching unread count:', error);
                res.status(500).json({ error: 'Failed to fetch unread count' });
            }
        });
    },
    // Mark notification as read
    markAsRead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const notificationId = parseInt(req.params.id);
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                if (isNaN(notificationId)) {
                    return res.status(400).json({ error: 'Invalid notification ID' });
                }
                const notification = yield prisma.notification.update({
                    where: {
                        id: notificationId,
                        recipientId: userId // Ensure user can only mark their own notifications
                    },
                    data: {
                        isRead: true
                    }
                });
                // Emit real-time update
                if (socketService_1.socketService.getIO()) {
                    socketService_1.socketService.getIO().to(`user_${userId}`).emit('notification_read', {
                        notificationId: notificationId
                    });
                }
                res.json({ message: 'Notification marked as read', notification });
            }
            catch (error) {
                console.error('Error marking notification as read:', error);
                if (error.code === 'P2025') {
                    return res.status(404).json({ error: 'Notification not found' });
                }
                res.status(500).json({ error: 'Failed to mark notification as read' });
            }
        });
    },
    // Mark all notifications as read
    markAllAsRead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                const result = yield prisma.notification.updateMany({
                    where: {
                        recipientId: userId,
                        isRead: false
                    },
                    data: {
                        isRead: true
                    }
                });
                // Emit real-time update
                if (socketService_1.socketService.getIO()) {
                    socketService_1.socketService.getIO().to(`user_${userId}`).emit('all_notifications_read');
                }
                res.json({
                    message: 'All notifications marked as read',
                    updatedCount: result.count
                });
            }
            catch (error) {
                console.error('Error marking all notifications as read:', error);
                res.status(500).json({ error: 'Failed to mark all notifications as read' });
            }
        });
    },
    // Delete notification
    deleteNotification(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const notificationId = parseInt(req.params.id);
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                if (isNaN(notificationId)) {
                    return res.status(400).json({ error: 'Invalid notification ID' });
                }
                yield prisma.notification.delete({
                    where: {
                        id: notificationId,
                        recipientId: userId // Ensure user can only delete their own notifications
                    }
                });
                res.json({ message: 'Notification deleted successfully' });
            }
            catch (error) {
                console.error('Error deleting notification:', error);
                if (error.code === 'P2025') {
                    return res.status(404).json({ error: 'Notification not found' });
                }
                res.status(500).json({ error: 'Failed to delete notification' });
            }
        });
    },
    // Get activity feed (public activities) - temporarily disabled due to type issues
    getActivityFeed(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            }
            catch (error) {
                console.error('Error fetching activity feed:', error);
                res.status(500).json({ error: 'Failed to fetch activity feed' });
            }
        });
    },
    // Create notification (admin/system use)
    createNotification(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, message, type, priority, recipientId, recipientType, relatedId, relatedType, actionUrl, actionText, metadata, expiresAt } = req.body;
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
                    notification = yield service.createNotification({
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
                }
                else {
                    // Fallback to direct database creation
                    notification = yield prisma.notification.create({
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
            }
            catch (error) {
                console.error('Error creating notification:', error);
                res.status(500).json({ error: 'Failed to create notification' });
            }
        });
    },
    // Clean up expired notifications
    cleanupExpired(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const result = yield prisma.notification.deleteMany({
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
            }
            catch (error) {
                console.error('Error cleaning up expired notifications:', error);
                res.status(500).json({ error: 'Failed to cleanup expired notifications' });
            }
        });
    }
};
exports.default = exports.notificationController;
