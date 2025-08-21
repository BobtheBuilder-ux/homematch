"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// All notification routes require authentication (allow all authenticated users)
router.use((0, authMiddleware_1.authMiddleware)(['landlord', 'tenant', 'agent', 'admin']));
// Get user notifications with pagination
router.get('/', notificationController_1.notificationController.getUserNotifications);
// Get unread notification count
router.get('/unread-count', notificationController_1.notificationController.getUnreadCount);
// Mark notification as read
router.patch('/:id/read', notificationController_1.notificationController.markAsRead);
// Mark all notifications as read
router.patch('/mark-all-read', notificationController_1.notificationController.markAllAsRead);
// Delete notification
router.delete('/:id', notificationController_1.notificationController.deleteNotification);
// Get activity feed
router.get('/activity-feed', notificationController_1.notificationController.getActivityFeed);
// Create notification (admin/system use)
router.post('/', notificationController_1.notificationController.createNotification);
// Clean up expired notifications (admin/system use)
router.delete('/cleanup/expired', notificationController_1.notificationController.cleanupExpired);
exports.default = router;
