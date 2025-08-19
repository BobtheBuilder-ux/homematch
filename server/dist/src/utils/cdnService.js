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
exports.cdnService = exports.CDNService = void 0;
const cloudinary_1 = require("cloudinary");
const redisService_1 = __importDefault(require("./redisService"));
/**
 * CDN Service for optimizing static asset delivery
 * Integrates with Cloudinary for image optimization and caching
 */
class CDNService {
    constructor() {
        this.CDN_CACHE_TTL = 24 * 60 * 60; // 24 hours
        this.IMAGE_TRANSFORMATIONS = {
            thumbnail: { width: 300, height: 200, crop: 'fill', quality: 'auto', format: 'webp' },
            medium: { width: 800, height: 600, crop: 'fill', quality: 'auto', format: 'webp' },
            large: { width: 1200, height: 900, crop: 'fill', quality: 'auto', format: 'webp' },
            hero: { width: 1920, height: 1080, crop: 'fill', quality: 'auto', format: 'webp' }
        };
        this.initializeCloudinary();
    }
    static getInstance() {
        if (!CDNService.instance) {
            CDNService.instance = new CDNService();
        }
        return CDNService.instance;
    }
    initializeCloudinary() {
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
    }
    /**
     * Generate optimized image URLs with caching
     */
    getOptimizedImageUrl(publicId_1) {
        return __awaiter(this, arguments, void 0, function* (publicId, transformation = 'medium', options = { cache: true }) {
            const cacheKey = `cdn:image:${publicId}:${transformation}`;
            if (options.cache) {
                const cachedUrl = yield redisService_1.default.get(cacheKey);
                if (cachedUrl) {
                    return cachedUrl;
                }
            }
            const transformationConfig = this.IMAGE_TRANSFORMATIONS[transformation];
            const optimizedUrl = cloudinary_1.v2.url(publicId, Object.assign(Object.assign({}, transformationConfig), { fetch_format: 'auto', quality: 'auto:good', flags: 'progressive' }));
            if (options.cache) {
                yield redisService_1.default.set(cacheKey, optimizedUrl, this.CDN_CACHE_TTL);
            }
            return optimizedUrl;
        });
    }
    /**
     * Generate multiple image sizes for responsive design
     */
    getResponsiveImageUrls(publicId_1) {
        return __awaiter(this, arguments, void 0, function* (publicId, sizes = ['thumbnail', 'medium', 'large']) {
            const urls = {};
            yield Promise.all(sizes.map((size) => __awaiter(this, void 0, void 0, function* () {
                urls[size] = yield this.getOptimizedImageUrl(publicId, size);
            })));
            return urls;
        });
    }
    /**
     * Preload critical images for better performance
     */
    preloadImages(publicIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const preloadPromises = publicIds.map((publicId) => __awaiter(this, void 0, void 0, function* () {
                // Preload thumbnail and medium sizes
                yield Promise.all([
                    this.getOptimizedImageUrl(publicId, 'thumbnail'),
                    this.getOptimizedImageUrl(publicId, 'medium')
                ]);
            }));
            yield Promise.all(preloadPromises);
        });
    }
    /**
     * Generate video streaming URLs with optimization
     */
    getOptimizedVideoUrl(publicId, options = {}) {
        const { quality = 'auto', format = 'auto', width, height } = options;
        return cloudinary_1.v2.url(publicId, {
            resource_type: 'video',
            quality,
            format,
            width,
            height,
            crop: 'scale',
            flags: 'streaming_attachment'
        });
    }
    /**
     * Invalidate CDN cache for specific assets
     */
    invalidateCache(publicIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidationPromises = publicIds.map((publicId) => __awaiter(this, void 0, void 0, function* () {
                const transformations = Object.keys(this.IMAGE_TRANSFORMATIONS);
                const cacheKeys = transformations.map(t => `cdn:image:${publicId}:${t}`);
                yield Promise.all(cacheKeys.map(key => redisService_1.default.del(key)));
            }));
            yield Promise.all(invalidationPromises);
        });
    }
    /**
     * Get CDN statistics and performance metrics
     */
    getCDNStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield redisService_1.default.get('cdn:stats');
            return stats ? JSON.parse(stats) : {
                cacheHitRate: 0,
                totalRequests: 0,
                bandwidthSaved: 0
            };
        });
    }
    /**
     * Update CDN statistics
     */
    updateStats(hit_1) {
        return __awaiter(this, arguments, void 0, function* (hit, bandwidthSaved = 0) {
            const currentStats = yield this.getCDNStats();
            const newStats = {
                cacheHitRate: hit
                    ? (currentStats.cacheHitRate * currentStats.totalRequests + 1) / (currentStats.totalRequests + 1)
                    : (currentStats.cacheHitRate * currentStats.totalRequests) / (currentStats.totalRequests + 1),
                totalRequests: currentStats.totalRequests + 1,
                bandwidthSaved: currentStats.bandwidthSaved + bandwidthSaved
            };
            yield redisService_1.default.set('cdn:stats', JSON.stringify(newStats), this.CDN_CACHE_TTL);
        });
    }
}
exports.CDNService = CDNService;
exports.cdnService = CDNService.getInstance();
