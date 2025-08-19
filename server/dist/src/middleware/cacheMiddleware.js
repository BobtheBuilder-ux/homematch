"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmCache = exports.invalidateCache = exports.analyticsCache = exports.landlordPropertiesCache = exports.userApplicationsCache = exports.singlePropertyCache = exports.propertyListingsCache = exports.cacheMiddleware = void 0;
const redisService_1 = __importStar(require("../utils/redisService"));
// Generic cache middleware
const cacheMiddleware = (options = {}) => {
    const { ttl = 300, // Default 5 minutes
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}`, condition = () => true } = options;
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        // Only cache GET requests by default
        if (req.method !== 'GET' || !condition(req)) {
            return next();
        }
        const cacheKey = keyGenerator(req);
        try {
            // Try to get cached response
            const cachedResponse = yield redisService_1.default.getJSON(cacheKey);
            if (cachedResponse) {
                console.log(`Cache hit for key: ${cacheKey}`);
                return res.json(cachedResponse);
            }
            // Store original json method
            const originalJson = res.json.bind(res);
            // Override json method to cache the response
            res.json = function (data) {
                // Cache successful responses (status 200-299)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisService_1.default.setJSON(cacheKey, data, ttl).catch(err => {
                        console.error('Failed to cache response:', err);
                    });
                    console.log(`Cached response for key: ${cacheKey}`);
                }
                return originalJson(data);
            };
            next();
        }
        catch (error) {
            console.error('Cache middleware error:', error);
            next(); // Continue without caching on error
        }
    });
};
exports.cacheMiddleware = cacheMiddleware;
// Property listings cache middleware
exports.propertyListingsCache = (0, exports.cacheMiddleware)({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => {
        const _a = req.query, { page, limit, location, propertyType, minPrice, maxPrice } = _a, filters = __rest(_a, ["page", "limit", "location", "propertyType", "minPrice", "maxPrice"]);
        const filterString = JSON.stringify(Object.assign({ page, limit, location, propertyType, minPrice, maxPrice }, filters));
        return redisService_1.RedisService.keys.properties(filterString);
    },
    condition: (req) => {
        // Only cache if not requesting real-time data
        return !req.query.realtime;
    }
});
// Single property cache middleware
exports.singlePropertyCache = (0, exports.cacheMiddleware)({
    ttl: 1800, // 30 minutes
    keyGenerator: (req) => {
        const propertyId = req.params.id;
        return redisService_1.RedisService.keys.property(parseInt(propertyId));
    }
});
// User applications cache middleware
exports.userApplicationsCache = (0, exports.cacheMiddleware)({
    ttl: 300, // 5 minutes
    keyGenerator: (req) => {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous';
        return redisService_1.RedisService.keys.applications(userId);
    },
    condition: (req) => {
        var _a;
        // Only cache for authenticated users
        return !!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    }
});
// Landlord properties cache middleware
exports.landlordPropertiesCache = (0, exports.cacheMiddleware)({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => {
        var _a;
        const landlordId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.params.landlordId;
        return redisService_1.RedisService.keys.landlordProperties(landlordId);
    }
});
// Analytics cache middleware
exports.analyticsCache = (0, exports.cacheMiddleware)({
    ttl: 3600, // 1 hour
    keyGenerator: (req) => {
        const analyticsType = req.params.type || 'general';
        const timeRange = req.query.timeRange || 'week';
        return redisService_1.RedisService.keys.analytics(`${analyticsType}:${timeRange}`);
    }
});
// Cache invalidation helper
exports.invalidateCache = {
    // Invalidate property-related caches
    properties: () => __awaiter(void 0, void 0, void 0, function* () {
        yield redisService_1.default.invalidatePattern('properties:*');
        yield redisService_1.default.invalidatePattern('property:*');
        console.log('Property caches invalidated');
    }),
    // Invalidate user-specific caches
    userApplications: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        yield redisService_1.default.del(redisService_1.RedisService.keys.applications(userId));
        console.log(`User applications cache invalidated for user: ${userId}`);
    }),
    // Invalidate landlord-specific caches
    landlordProperties: (landlordId) => __awaiter(void 0, void 0, void 0, function* () {
        yield redisService_1.default.del(redisService_1.RedisService.keys.landlordProperties(landlordId));
        yield redisService_1.default.invalidatePattern('properties:*'); // Also invalidate general property listings
        console.log(`Landlord properties cache invalidated for landlord: ${landlordId}`);
    }),
    // Invalidate analytics caches
    analytics: () => __awaiter(void 0, void 0, void 0, function* () {
        yield redisService_1.default.invalidatePattern('analytics:*');
        console.log('Analytics caches invalidated');
    }),
    // Invalidate all caches
    all: () => __awaiter(void 0, void 0, void 0, function* () {
        yield redisService_1.default.invalidatePattern('*');
        console.log('All caches invalidated');
    })
};
// Cache warming functions
exports.warmCache = {
    // Pre-load popular property searches
    popularProperties: () => __awaiter(void 0, void 0, void 0, function* () {
        // This would typically be called during off-peak hours
        console.log('Warming property cache...');
        // Implementation would depend on your most common search patterns
    })
};
