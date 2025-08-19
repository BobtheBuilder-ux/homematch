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
exports.QueryOptimizationService = void 0;
const redisService_1 = __importDefault(require("../utils/redisService"));
const performanceMiddleware_1 = require("../middleware/performanceMiddleware");
class QueryOptimizationService {
    constructor(prisma) {
        this.CACHE_TTL = 300; // 5 minutes
        this.DEFAULT_LIMIT = 20;
        this.MAX_LIMIT = 100;
        this.prisma = prisma;
    }
    /**
     * Optimized property search with pagination, caching, and performance tracking
     */
    getOptimizedProperties(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const cacheKey = this.generateCacheKey('properties', filters);
            // Try to get from cache first
            const cachedResult = yield redisService_1.default.get(cacheKey);
            if (cachedResult) {
                return Object.assign(Object.assign({}, JSON.parse(cachedResult)), { performance: {
                        queryTime: Date.now() - startTime,
                        cacheHit: true
                    } });
            }
            // Parse pagination parameters
            const page = Math.max(1, parseInt(filters.page || '1'));
            const limit = Math.min(this.MAX_LIMIT, parseInt(filters.limit || this.DEFAULT_LIMIT.toString()));
            const offset = (page - 1) * limit;
            // Build optimized where conditions
            const whereConditions = this.buildWhereConditions(filters);
            const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);
            try {
                // Use Promise.all for parallel execution of count and data queries
                const [totalCount, properties] = yield Promise.all([
                    this.getPropertiesCount(whereConditions),
                    this.getPropertiesData(whereConditions, orderBy, limit, offset)
                ]);
                const totalPages = Math.ceil(totalCount / limit);
                const result = {
                    data: properties,
                    pagination: {
                        page,
                        limit,
                        total: totalCount,
                        totalPages,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    },
                    filters,
                    performance: {
                        queryTime: Date.now() - startTime,
                        cacheHit: false
                    }
                };
                // Cache the result
                yield redisService_1.default.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
                // Track performance
                performanceMiddleware_1.DatabasePerformanceTracker.trackQuery('getOptimizedProperties', Date.now() - startTime);
                return result;
            }
            catch (error) {
                console.error('Error in optimized property query:', error);
                throw error;
            }
        });
    }
    /**
     * Get single property with optimized includes
     */
    getOptimizedProperty(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const cacheKey = `property:${id}`;
            // Try cache first
            const cachedProperty = yield redisService_1.default.get(cacheKey);
            if (cachedProperty) {
                return JSON.parse(cachedProperty);
            }
            try {
                const property = yield this.prisma.property.findUnique({
                    where: { id },
                    include: {
                        location: {
                            select: {
                                id: true,
                                address: true,
                                city: true,
                                state: true,
                                country: true,
                                postalCode: true
                            }
                        },
                        landlord: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phoneNumber: true
                            }
                        },
                        // Only get active leases
                        leases: {
                            where: {
                                endDate: {
                                    gte: new Date()
                                }
                            },
                            select: {
                                id: true,
                                startDate: true,
                                endDate: true,
                                rent: true
                            }
                        },
                        // Only get recent applications
                        applications: {
                            where: {
                                applicationDate: {
                                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                                }
                            },
                            select: {
                                id: true,
                                status: true,
                                applicationDate: true
                            }
                        }
                    }
                });
                if (property) {
                    // Cache for 10 minutes
                    yield redisService_1.default.set(cacheKey, JSON.stringify(property), 600);
                    performanceMiddleware_1.DatabasePerformanceTracker.trackQuery('getOptimizedProperty', Date.now() - startTime);
                }
                return property;
            }
            catch (error) {
                console.error('Error in optimized single property query:', error);
                throw error;
            }
        });
    }
    /**
     * Build optimized where conditions using Prisma's type-safe approach
     */
    buildWhereConditions(filters) {
        const where = {
            status: 'Available' // Only show available properties
        };
        if (filters.favoriteIds) {
            const favoriteIdsArray = filters.favoriteIds.split(',').map(Number);
            where.id = { in: favoriteIdsArray };
        }
        if (filters.priceMin || filters.priceMax) {
            where.pricePerYear = {};
            if (filters.priceMin)
                where.pricePerYear.gte = Number(filters.priceMin);
            if (filters.priceMax)
                where.pricePerYear.lte = Number(filters.priceMax);
        }
        if (filters.beds && filters.beds !== 'any') {
            where.beds = { gte: Number(filters.beds) };
        }
        if (filters.baths && filters.baths !== 'any') {
            where.baths = { gte: Number(filters.baths) };
        }
        if (filters.squareFeetMin || filters.squareFeetMax) {
            where.squareFeet = {};
            if (filters.squareFeetMin)
                where.squareFeet.gte = Number(filters.squareFeetMin);
            if (filters.squareFeetMax)
                where.squareFeet.lte = Number(filters.squareFeetMax);
        }
        if (filters.propertyType && filters.propertyType !== 'any') {
            where.propertyType = filters.propertyType;
        }
        if (filters.name && !filters.latitude && !filters.longitude) {
            where.name = { contains: filters.name, mode: 'insensitive' };
        }
        if (filters.location && !filters.latitude && !filters.longitude) {
            where.location = {
                OR: [
                    { city: { contains: filters.location, mode: 'insensitive' } },
                    { state: { contains: filters.location, mode: 'insensitive' } },
                    { country: { contains: filters.location, mode: 'insensitive' } },
                    { address: { contains: filters.location, mode: 'insensitive' } }
                ]
            };
        }
        if (filters.amenities && filters.amenities !== 'any') {
            const amenitiesArray = filters.amenities.split(',');
            where.amenities = {
                contains: amenitiesArray[0], // For simplicity, search for first amenity
                mode: 'insensitive'
            };
        }
        return where;
    }
    /**
     * Build order by clause
     */
    buildOrderBy(sortBy, sortOrder) {
        const order = sortOrder === 'desc' ? 'desc' : 'asc';
        switch (sortBy) {
            case 'price':
                return { pricePerYear: order };
            case 'date':
                return { postedDate: order };
            case 'beds':
                return { beds: order };
            case 'baths':
                return { baths: order };
            case 'squareFeet':
                return { squareFeet: order };
            default:
                return { postedDate: 'desc' }; // Default: newest first
        }
    }
    /**
     * Get properties count for pagination
     */
    getPropertiesCount(where) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.prisma.property.count({ where });
        });
    }
    /**
     * Get properties data with optimized includes
     */
    getPropertiesData(where, orderBy, limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.prisma.property.findMany({
                where,
                orderBy,
                take: limit,
                skip: offset,
                include: {
                    location: {
                        select: {
                            id: true,
                            address: true,
                            city: true,
                            state: true,
                            country: true,
                            postalCode: true
                        }
                    },
                    // Don't include heavy relations in list view
                    _count: {
                        select: {
                            applications: true,
                            leases: true
                        }
                    }
                }
            });
        });
    }
    /**
     * Generate cache key for filters
     */
    generateCacheKey(prefix, filters) {
        const filterString = Object.entries(filters)
            .filter(([_, value]) => value !== undefined && value !== '')
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${value}`)
            .join('|');
        return `${prefix}:${Buffer.from(filterString).toString('base64')}`;
    }
    /**
     * Invalidate cache for property-related queries
     */
    invalidatePropertyCache(propertyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const patterns = ['properties:*'];
            if (propertyId) {
                patterns.push(`property:${propertyId}`);
            }
            yield Promise.all(patterns.map(pattern => redisService_1.default.invalidatePattern(pattern)));
        });
    }
}
exports.QueryOptimizationService = QueryOptimizationService;
