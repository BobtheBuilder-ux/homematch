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
exports.cdnHeadersMiddleware = exports.responsiveImageMiddleware = exports.propertyImageOptimizationMiddleware = exports.imageOptimizationMiddleware = void 0;
const cdnService_1 = require("../utils/cdnService");
/**
 * Middleware to automatically optimize images in API responses
 */
const imageOptimizationMiddleware = () => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const originalJson = res.json;
        res.json = function (data) {
            // Intercept response and optimize image URLs
            const optimizedData = optimizeImageUrls(data);
            return originalJson.call(this, optimizedData);
        };
        next();
    });
};
exports.imageOptimizationMiddleware = imageOptimizationMiddleware;
/**
 * Recursively optimize image URLs in response data
 */
function optimizeImageUrls(data) {
    if (!data)
        return data;
    if (Array.isArray(data)) {
        return data.map(item => optimizeImageUrls(item));
    }
    if (typeof data === 'object') {
        const optimized = Object.assign({}, data);
        // Optimize common image fields
        const imageFields = ['photoUrls', 'imageUrl', 'avatarUrl', 'thumbnailUrl'];
        for (const field of imageFields) {
            if (optimized[field]) {
                if (Array.isArray(optimized[field])) {
                    // Handle array of image URLs
                    optimized[field] = optimized[field].map((url) => getOptimizedUrlSync(url));
                }
                else if (typeof optimized[field] === 'string') {
                    // Handle single image URL
                    optimized[field] = getOptimizedUrlSync(optimized[field]);
                }
            }
        }
        // Recursively process nested objects
        for (const key in optimized) {
            if (typeof optimized[key] === 'object') {
                optimized[key] = optimizeImageUrls(optimized[key]);
            }
        }
        return optimized;
    }
    return data;
}
/**
 * Synchronously get optimized URL (for middleware use)
 */
function getOptimizedUrlSync(url) {
    // Extract Cloudinary public ID from URL if it's a Cloudinary URL
    const cloudinaryMatch = url.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp|gif)$/i);
    if (cloudinaryMatch) {
        const publicId = cloudinaryMatch[1];
        // Return optimized URL with basic transformations
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto:good,fl_progressive/${publicId}`;
    }
    return url; // Return original URL if not Cloudinary
}
/**
 * Middleware for property listings with image preloading
 */
const propertyImageOptimizationMiddleware = () => {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            if (data && (data.properties || Array.isArray(data))) {
                const properties = data.properties || data;
                // Preload critical images for better performance
                if (Array.isArray(properties)) {
                    const imageUrls = properties
                        .flatMap((property) => property.photoUrls || [])
                        .slice(0, 10); // Limit to first 10 images
                    // Extract public IDs and preload
                    const publicIds = imageUrls
                        .map((url) => {
                        const match = url.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp|gif)$/i);
                        return match ? match[1] : null;
                    })
                        .filter((id) => id !== null);
                    if (publicIds.length > 0) {
                        // Preload images asynchronously without blocking response
                        cdnService_1.cdnService.preloadImages(publicIds).catch(error => {
                            console.error('Error preloading images:', error);
                        });
                    }
                }
                // Optimize image URLs in response
                const optimizedData = optimizeImageUrls(data);
                return originalJson(optimizedData);
            }
            return originalJson(data);
        };
        next();
    };
};
exports.propertyImageOptimizationMiddleware = propertyImageOptimizationMiddleware;
/**
 * Middleware to add responsive image URLs to property responses
 */
const responsiveImageMiddleware = () => {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            if (data && data.photoUrls && Array.isArray(data.photoUrls)) {
                // Generate responsive images asynchronously without blocking response
                Promise.all(data.photoUrls.slice(0, 5).map((url) => __awaiter(this, void 0, void 0, function* () {
                    const match = url.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp|gif)$/i);
                    if (match) {
                        const publicId = match[1];
                        return yield cdnService_1.cdnService.getResponsiveImageUrls(publicId);
                    }
                    return { original: url };
                }))).then(responsiveImages => {
                    data.responsiveImages = responsiveImages;
                }).catch(error => {
                    console.error('Error generating responsive images:', error);
                });
            }
            return originalJson(data);
        };
        next();
    };
};
exports.responsiveImageMiddleware = responsiveImageMiddleware;
/**
 * Middleware to add CDN headers for better caching
 */
const cdnHeadersMiddleware = () => {
    return (req, res, next) => {
        // Set cache headers for static assets
        if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|css|js)$/)) {
            res.set({
                'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
                'Expires': new Date(Date.now() + 31536000000).toUTCString(),
                'ETag': `"${Date.now()}"`,
                'Vary': 'Accept-Encoding'
            });
        }
        // Set cache headers for API responses with images
        if (req.path.includes('/properties') || req.path.includes('/images')) {
            res.set({
                'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // 5 minutes
                'Vary': 'Accept-Encoding'
            });
        }
        next();
    };
};
exports.cdnHeadersMiddleware = cdnHeadersMiddleware;
