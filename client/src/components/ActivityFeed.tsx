"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  User,
  Home,
  FileText,
  CreditCard,
  Settings,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw
} from 'lucide-react';

interface ActivityData {
  id: number;
  type: string;
  title: string;
  description: string;
  userId: string;
  createdAt: string;
  data?: any;
}

interface ActivityFeedProps {
  userId?: string;
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  maxItems = 10,
  showHeader = true,
  className = ''
}) => {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useSocket();

  // Fetch initial activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          return;
        }

        const queryParams = new URLSearchParams();
        if (userId) queryParams.append('userId', userId);
        queryParams.append('limit', maxItems.toString());

        const response = await fetch(`/api/activities?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }

        const data = await response.json();
        setActivities(data.activities || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId, maxItems]);

  // Listen for real-time activity updates
  useEffect(() => {
    if (!isConnected) return;

    const handleNewActivity = (activity: ActivityData) => {
      // Only add if it matches the user filter (if specified)
      if (!userId || activity.userId === userId) {
        setActivities(prev => {
          const updated = [activity, ...prev];
          return updated.slice(0, maxItems); // Keep only the latest items
        });
      }
    };

    let unsubscribe: (() => void) | null = null;

    // Subscribe to activity updates via socket
    import('@/services/socketService').then(({ default: socketService }) => {
      unsubscribe = socketService.onActivity(handleNewActivity);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isConnected, userId, maxItems]);

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'user_registered':
      case 'user_updated':
        return <User className="h-4 w-4" />;
      case 'property_created':
      case 'property_updated':
      case 'property_deleted':
        return <Home className="h-4 w-4" />;
      case 'application_submitted':
      case 'application_approved':
      case 'application_rejected':
        return <FileText className="h-4 w-4" />;
      case 'payment_completed':
      case 'payment_failed':
        return <CreditCard className="h-4 w-4" />;
      case 'notification_sent':
        return <Bell className="h-4 w-4" />;
      case 'system_update':
      case 'settings_changed':
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'application_approved':
      case 'payment_completed':
      case 'property_created':
        return 'text-green-600';
      case 'application_rejected':
      case 'payment_failed':
      case 'property_deleted':
        return 'text-red-600';
      case 'application_submitted':
      case 'property_updated':
        return 'text-blue-600';
      case 'user_registered':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type.toLowerCase()) {
      case 'application_approved':
      case 'payment_completed':
        return 'default';
      case 'application_rejected':
      case 'payment_failed':
        return 'destructive';
      case 'application_submitted':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const refreshActivities = () => {
    setLoading(true);
    // Trigger a re-fetch by updating a dependency
    window.location.reload();
  };

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Feed
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Feed
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-600 text-center mb-4">{error}</p>
            <Button onClick={refreshActivities} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
            {isConnected && (
              <Badge variant="outline" className="ml-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live
              </Badge>
            )}
          </CardTitle>
          <Button onClick={refreshActivities} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Info className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500 text-center">No recent activities</p>
              <p className="text-sm text-gray-400 text-center mt-1">
                Activities will appear here as they happen
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </h4>
                        <Badge variant={getBadgeVariant(activity.type)} className="ml-2 text-xs">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                        {activity.data && (
                          <span className="text-xs text-gray-500">
                            ID: {activity.data.id || activity.data.propertyId || activity.data.applicationId || 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;