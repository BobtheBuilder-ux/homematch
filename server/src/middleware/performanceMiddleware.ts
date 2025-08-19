import { Request, Response, NextFunction } from 'express';
import redisService from '../utils/redisService';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

interface DatabaseMetrics {
  query: string;
  duration: number;
  timestamp: number;
}

interface AggregatedMetrics {
  totalRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRequests: number;
  endpoints: Record<string, {
    count: number;
    totalTime: number;
    averageTime: number;
  }>;
  statusCodes: Record<string, number>;
}

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime();

  // Store original end method
  const originalEnd = res.end;

  // Override end method to capture metrics
  res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
    const endTime = Date.now();
    const diff = process.hrtime(startHrTime);
    const responseTime = diff[0] * 1000 + diff[1] * 1e-6; // Convert to milliseconds

    const metrics: PerformanceMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      responseTime: Math.round(responseTime * 100) / 100, // Round to 2 decimal places
      statusCode: res.statusCode,
      timestamp: endTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    };

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // Store metrics in Redis for analytics (async, don't block response)
    storeMetrics(metrics).catch(err => {
      console.error('Failed to store performance metrics:', err);
    });

    // Call original end method and return the result
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

// Store performance metrics in Redis
async function storeMetrics(metrics: PerformanceMetrics): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const hour = new Date().getHours();
    
    // Store individual metric
    const metricKey = `metrics:${date}:${hour}:${Date.now()}`;
    await redisService.setJSON(metricKey, metrics, 86400); // Store for 24 hours

    // Update aggregated metrics
    await updateAggregatedMetrics(metrics, date, hour);
  } catch (error) {
    console.error('Error storing metrics:', error);
  }
}

// Update aggregated performance metrics
async function updateAggregatedMetrics(metrics: PerformanceMetrics, date: string, hour: number): Promise<void> {
  try {
    const aggregateKey = `metrics:aggregate:${date}:${hour}`;
    
    // Get existing aggregated data
    const existing: AggregatedMetrics = await redisService.getJSON(aggregateKey) || {
      totalRequests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorRequests: 0,
      endpoints: {},
      statusCodes: {},
    };

    // Update aggregated metrics
    existing.totalRequests += 1;
    existing.totalResponseTime += metrics.responseTime;
    existing.averageResponseTime = existing.totalResponseTime / existing.totalRequests;
    
    if (metrics.responseTime > 1000) {
      existing.slowRequests += 1;
    }
    
    if (metrics.statusCode >= 400) {
      existing.errorRequests += 1;
    }

    // Track endpoint-specific metrics
    if (!existing.endpoints[metrics.endpoint]) {
      existing.endpoints[metrics.endpoint] = {
        count: 0,
        totalTime: 0,
        averageTime: 0,
      };
    }
    existing.endpoints[metrics.endpoint].count += 1;
    existing.endpoints[metrics.endpoint].totalTime += metrics.responseTime;
    existing.endpoints[metrics.endpoint].averageTime = 
      existing.endpoints[metrics.endpoint].totalTime / existing.endpoints[metrics.endpoint].count;

    // Track status code distribution
    existing.statusCodes[metrics.statusCode] = (existing.statusCodes[metrics.statusCode] || 0) + 1;

    // Store updated aggregated metrics (expire after 7 days)
    await redisService.setJSON(aggregateKey, existing, 604800);
  } catch (error) {
    console.error('Error updating aggregated metrics:', error);
  }
}

// Health check middleware
export const healthCheckMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health') {
    const startTime = Date.now();
    
    try {
      // Check Redis connection
      const redisHealthy = await redisService.exists('health:check');
      await redisService.set('health:check', 'ok', 60); // Set with 1 minute TTL
      
      // Check database connection (you'll need to import your database service)
      // const dbHealthy = await databaseService.healthCheck();
      
      const responseTime = Date.now() - startTime;
      
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          redis: redisHealthy ? 'healthy' : 'unhealthy',
          // database: dbHealthy ? 'healthy' : 'unhealthy',
        },
        responseTime: `${responseTime}ms`,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      };
      
      res.json(healthStatus);
      return;
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  }
  
  next();
};

// Metrics endpoint middleware
export const metricsEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/metrics') {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const hour = req.query.hour ? parseInt(req.query.hour as string) : new Date().getHours();
      
      const aggregateKey = `metrics:aggregate:${date}:${hour}`;
      const metrics = await redisService.getJSON(aggregateKey);
      
      if (!metrics) {
        res.json({
          message: 'No metrics available for the specified time period',
          date,
          hour,
        });
        return;
      }
      
      res.json({
        date,
        hour,
        metrics,
      });
      return;
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  }
  
  next();
};

// Database query performance tracking
export class DatabasePerformanceTracker {
  private static metrics: DatabaseMetrics[] = [];
  private static readonly MAX_METRICS = 1000; // Keep last 1000 queries

  static trackQuery(query: string, duration: number): void {
    const metric: DatabaseMetrics = {
      query: query.substring(0, 200), // Truncate long queries
      duration: Math.round(duration * 100) / 100,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    
    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.warn(`Slow database query detected: ${duration}ms - ${query.substring(0, 100)}...`);
    }
  }

  static getMetrics(): DatabaseMetrics[] {
    return [...this.metrics]; // Return copy
  }

  static getSlowQueries(threshold: number = 100): DatabaseMetrics[] {
    return this.metrics.filter(metric => metric.duration > threshold);
  }

  static getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return Math.round((total / this.metrics.length) * 100) / 100;
  }

  static clearMetrics(): void {
    this.metrics = [];
  }
}