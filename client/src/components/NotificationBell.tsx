'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationData } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PropertyUpdate': return '🏠';
      case 'ApplicationStatus': return '📋';
      case 'PaymentReminder': return '💰';
      case 'InspectionScheduled': return '🔍';
      case 'LeaseExpiring': return '📅';
      case 'MaintenanceRequest': return '🔧';
      case 'SystemAlert': return '⚠️';
      case 'Welcome': return '👋';
      default: return '📢';
    }
  };

  const handleAction = () => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
      if (!notification.isRead) {
        onMarkAsRead(notification.id);
      }
    }
  };

  return (
    <div className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="text-lg">{getTypeIcon(notification.type)}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge 
                variant="secondary" 
                className={`text-xs px-1.5 py-0.5 ${getPriorityColor(notification.priority)} text-white`}
              >
                {notification.priority}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            <div className="flex items-center gap-1">
              {notification.actionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAction}
                  className="h-6 px-2 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {notification.actionText || 'View'}
                </Button>
              )}
              
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-6 px-2"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-6 px-2 text-red-600 hover:text-red-700"
                title="Delete notification"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<number | null>(null);

  const handleMarkAsRead = async (notificationId: number) => {
    setLoadingAction(notificationId);
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (notificationId: number) => {
    setLoadingAction(notificationId);
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoadingAction(-1);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-gray-100"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 p-0"
        sideOffset={5}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={loadingAction === -1}
                className="h-6 px-2 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-6 px-2"
              title="Refresh notifications"
            >
              <Bell className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="max-h-80">
          {isLoading && notifications.length === 0 ? (
            <div className="p-3 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {error && (
          <div className="p-3 border-t bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setIsOpen(false);
                // Navigate to full notifications page if it exists
                // window.location.href = '/notifications';
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;