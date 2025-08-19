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
exports.DatabasePerformanceTracker = exports.metricsEndpoint = exports.healthCheckMiddleware = exports.performanceMiddleware = void 0;
const redisService_1 = __importDefault(require("../utils/redisService"));
// Performance monitoring middleware
const performanceMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const startHrTime = process.hrtime();
    // Store original end method
    const originalEnd = res.end;
    // Override end method to capture metrics
    res.end = function (chunk, encoding, cb) {
        var _a;
        const endTime = Date.now();
        const diff = process.hrtime(startHrTime);
        const responseTime = diff[0] * 1000 + diff[1] * 1e-6; // Convert to milliseconds
        const metrics = {
            endpoint: ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.path,
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
exports.performanceMiddleware = performanceMiddleware;
// Store performance metrics in Redis
function storeMetrics(metrics) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const hour = new Date().getHours();
            // Store individual metric
            const metricKey = `metrics:${date}:${hour}:${Date.now()}`;
            yield redisService_1.default.setJSON(metricKey, metrics, 86400); // Store for 24 hours
            // Update aggregated metrics
            yield updateAggregatedMetrics(metrics, date, hour);
        }
        catch (error) {
            console.error('Error storing metrics:', error);
        }
    });
}
// Update aggregated performance metrics
function updateAggregatedMetrics(metrics, date, hour) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const aggregateKey = `metrics:aggregate:${date}:${hour}`;
            // Get existing aggregated data
            const existing = (yield redisService_1.default.getJSON(aggregateKey)) || {
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
            yield redisService_1.default.setJSON(aggregateKey, existing, 604800);
        }
        catch (error) {
            console.error('Error updating aggregated metrics:', error);
        }
    });
}
// Health check middleware
const healthCheckMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.path === '/health') {
        const startTime = Date.now();
        try {
            // Check Redis connection
            const redisHealthy = yield redisService_1.default.exists('health:check');
            yield redisService_1.default.set('health:check', 'ok', 60); // Set with 1 minute TTL
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
        }
        catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return;
        }
    }
    next();
});
exports.healthCheckMiddleware = healthCheckMiddleware;
// Metrics endpoint middleware
const metricsEndpoint = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.path === '/metrics') {
        try {
            const date = req.query.date || new Date().toISOString().split('T')[0];
            const hour = req.query.hour ? parseInt(req.query.hour) : new Date().getHours();
            const aggregateKey = `metrics:aggregate:${date}:${hour}`;
            const metrics = yield redisService_1.default.getJSON(aggregateKey);
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
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve metrics',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
            return;
        }
    }
    next();
});
exports.metricsEndpoint = metricsEndpoint;
// Database query performance tracking
class DatabasePerformanceTracker {
    static trackQuery(query, duration) {
        const metric = {
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
    static getMetrics() {
        return [...this.metrics]; // Return copy
    }
    static getSlowQueries(threshold = 100) {
        return this.metrics.filter(metric => metric.duration > threshold);
    }
    static getAverageQueryTime() {
        if (this.metrics.length === 0)
            return 0;
        const total = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
        return Math.round((total / this.metrics.length) * 100) / 100;
    }
    static clearMetrics() {
        this.metrics = [];
    }
}
exports.DatabasePerformanceTracker = DatabasePerformanceTracker;
DatabasePerformanceTracker.metrics = [];
DatabasePerformanceTracker.MAX_METRICS = 1000; // Keep last 1000 queries
