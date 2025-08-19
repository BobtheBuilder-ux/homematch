import { Request, Response, NextFunction } from 'express';
import redisService, { RedisService } from '../utils/redisService';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

// Generic cache middleware
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // Default 5 minutes
    keyGenerator = (req: Request) => `cache:${req.method}:${req.originalUrl}`,
    condition = () => true
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests by default
    if (req.method !== 'GET' || !condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get cached response
      const cachedResponse = await redisService.getJSON(cacheKey);
      
      if (cachedResponse) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return res.json(cachedResponse);
      }

      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache the response
      res.json = function(data: any) {
        // Cache successful responses (status 200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisService.setJSON(cacheKey, data, ttl).catch(err => {
            console.error('Failed to cache response:', err);
          });
          console.log(`Cached response for key: ${cacheKey}`);
        }
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

// Property listings cache middleware
export const propertyListingsCache = cacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req: Request) => {
    const { page, limit, location, propertyType, minPrice, maxPrice, ...filters } = req.query;
    const filterString = JSON.stringify({ page, limit, location, propertyType, minPrice, maxPrice, ...filters });
    return RedisService.keys.properties(filterString);
  },
  condition: (req: Request) => {
    // Only cache if not requesting real-time data
    return !req.query.realtime;
  }
});

// Single property cache middleware
export const singlePropertyCache = cacheMiddleware({
  ttl: 1800, // 30 minutes
  keyGenerator: (req: Request) => {
    const propertyId = req.params.id;
    return RedisService.keys.property(parseInt(propertyId));
  }
});

// User applications cache middleware
export const userApplicationsCache = cacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || 'anonymous';
    return RedisService.keys.applications(userId);
  },
  condition: (req: Request) => {
    // Only cache for authenticated users
    return !!(req as any).user?.id;
  }
});

// Landlord properties cache middleware
export const landlordPropertiesCache = cacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req: Request) => {
    const landlordId = (req as any).user?.id || req.params.landlordId;
    return RedisService.keys.landlordProperties(landlordId);
  }
});

// Analytics cache middleware
export const analyticsCache = cacheMiddleware({
  ttl: 3600, // 1 hour
  keyGenerator: (req: Request) => {
    const analyticsType = req.params.type || 'general';
    const timeRange = req.query.timeRange || 'week';
    return RedisService.keys.analytics(`${analyticsType}:${timeRange}`);
  }
});

// Cache invalidation helper
export const invalidateCache = {
  // Invalidate property-related caches
  properties: async () => {
    await redisService.invalidatePattern('properties:*');
    await redisService.invalidatePattern('property:*');
    console.log('Property caches invalidated');
  },

  // Invalidate user-specific caches
  userApplications: async (userId: string) => {
    await redisService.del(RedisService.keys.applications(userId));
    console.log(`User applications cache invalidated for user: ${userId}`);
  },

  // Invalidate landlord-specific caches
  landlordProperties: async (landlordId: string) => {
    await redisService.del(RedisService.keys.landlordProperties(landlordId));
    await redisService.invalidatePattern('properties:*'); // Also invalidate general property listings
    console.log(`Landlord properties cache invalidated for landlord: ${landlordId}`);
  },

  // Invalidate analytics caches
  analytics: async () => {
    await redisService.invalidatePattern('analytics:*');
    console.log('Analytics caches invalidated');
  },

  // Invalidate all caches
  all: async () => {
    await redisService.invalidatePattern('*');
    console.log('All caches invalidated');
  }
};

// Cache warming functions
export const warmCache = {
  // Pre-load popular property searches
  popularProperties: async () => {
    // This would typically be called during off-peak hours
    console.log('Warming property cache...');
    // Implementation would depend on your most common search patterns
  }
};