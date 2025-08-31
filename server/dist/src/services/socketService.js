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
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
const auth_1 = require("../auth");
const database_1 = require("../utils/database");
class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId
    }
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
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
        this.io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const token = socket.handshake.auth.token || ((_a = socket.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''));
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                // Validate session using BetterAuth
                const headers = new Headers();
                headers.set('authorization', `Bearer ${token}`);
                if (socket.handshake.headers.cookie) {
                    headers.set('cookie', socket.handshake.headers.cookie);
                }
                const session = yield auth_1.auth.api.getSession({
                    headers
                });
                if (!session || !session.user) {
                    return next(new Error('Invalid or expired session'));
                }
                const userId = session.user.id;
                const userRole = session.user.role || 'tenant';
                const userEmail = session.user.email;
                // Fetch additional user details from database based on role
                let user = null;
                let userType = userRole;
                // Check based on role from BetterAuth
                if (userRole === 'tenant') {
                    user = yield database_1.databaseService.getClient().tenant.findFirst({
                        where: { email: userEmail },
                        select: { id: true, email: true, name: true },
                    });
                }
                else if (userRole === 'landlord') {
                    user = yield database_1.databaseService.getClient().landlord.findFirst({
                        where: { email: userEmail },
                        select: { id: true, email: true, name: true },
                    });
                }
                else if (userRole === 'agent') {
                    user = yield database_1.databaseService.getClient().agent.findFirst({
                        where: { email: userEmail },
                        select: { id: true, email: true, name: true },
                    });
                }
                else if (userRole === 'admin') {
                    user = yield database_1.databaseService.getClient().admin.findFirst({
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
            }
            catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Invalid authentication token'));
            }
        }));
        this.io.on('connection', (socket) => {
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
            socket.on('join-property', (propertyId) => {
                socket.join(`property:${propertyId}`);
                console.log(`User ${socket.userId} joined property room: ${propertyId}`);
            });
            // Handle leaving property-specific rooms
            socket.on('leave-property', (propertyId) => {
                socket.leave(`property:${propertyId}`);
                console.log(`User ${socket.userId} left property room: ${propertyId}`);
            });
            // Handle joining application-specific rooms
            socket.on('join-application', (applicationId) => {
                socket.join(`application:${applicationId}`);
                console.log(`User ${socket.userId} joined application room: ${applicationId}`);
            });
            // Handle leaving application-specific rooms
            socket.on('leave-application', (applicationId) => {
                socket.leave(`application:${applicationId}`);
                console.log(`User ${socket.userId} left application room: ${applicationId}`);
            });
            // Handle marking notifications as read
            socket.on('mark-notification-read', (notificationId) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield database_1.databaseService.getClient().notification.update({
                        where: { id: parseInt(notificationId) },
                        data: { isRead: true },
                    });
                    // Emit confirmation back to user
                    socket.emit('notification-marked-read', { notificationId });
                }
                catch (error) {
                    console.error('Error marking notification as read:', error);
                }
            }));
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
    sendNotificationToUser(userId, notification) {
        if (this.io) {
            this.io.to(`user:${userId}`).emit('new-notification', notification);
        }
    }
    // Send notification to all users with specific role
    sendNotificationToRole(role, notification) {
        if (this.io) {
            this.io.to(`role:${role}`).emit('new-notification', notification);
        }
    }
    // Send notification to property-specific room
    sendNotificationToProperty(propertyId, notification) {
        if (this.io) {
            this.io.to(`property:${propertyId}`).emit('property-update', notification);
        }
    }
    // Send notification to application-specific room
    sendNotificationToApplication(applicationId, notification) {
        if (this.io) {
            this.io.to(`application:${applicationId}`).emit('application-update', notification);
        }
    }
    // Send activity feed update
    sendActivityUpdate(userId, activity) {
        if (this.io) {
            this.io.to(`user:${userId}`).emit('activity-update', activity);
        }
    }
    // Broadcast system-wide announcement
    broadcastAnnouncement(announcement) {
        if (this.io) {
            this.io.emit('system-announcement', announcement);
        }
    }
    // Get connected users count
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    // Check if user is online
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
    // Get socket instance
    getIO() {
        return this.io;
    }
}
exports.socketService = new SocketService();
exports.default = exports.socketService;
