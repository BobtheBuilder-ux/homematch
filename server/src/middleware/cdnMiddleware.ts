import { Request, Response, NextFunction } from 'express';
import { cdnService } from '../utils/cdnService';

/**
 * Middleware to automatically optimize images in API responses
 */
export const imageOptimizationMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Intercept response and optimize image URLs
      const optimizedData = optimizeImageUrls(data);
      return originalJson.call(this, optimizedData);
    };
    
    next();
  };
};

/**
 * Recursively optimize image URLs in response data
 */
function optimizeImageUrls(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => optimizeImageUrls(item));
  }
  
  if (typeof data === 'object') {
    const optimized = { ...data };
    
    // Optimize common image fields
    const imageFields = ['photoUrls', 'imageUrl', 'avatarUrl', 'thumbnailUrl'];
    
    for (const field of imageFields) {
      if (optimized[field]) {
        if (Array.isArray(optimized[field])) {
          // Handle array of image URLs
          optimized[field] = optimized[field].map((url: string) => 
            getOptimizedUrlSync(url)
          );
        } else if (typeof optimized[field] === 'string') {
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
function getOptimizedUrlSync(url: string): string {
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
export const propertyImageOptimizationMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      if (data && (data.properties || Array.isArray(data))) {
        const properties = data.properties || data;
        
        // Preload critical images for better performance
        if (Array.isArray(properties)) {
          const imageUrls = properties
            .flatMap((property: any) => property.photoUrls || [])
            .slice(0, 10); // Limit to first 10 images
          
          // Extract public IDs and preload
          const publicIds = imageUrls
            .map((url: string) => {
              const match = url.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp|gif)$/i);
              return match ? match[1] : null;
            })
            .filter((id): id is string => id !== null);
          
          if (publicIds.length > 0) {
            // Preload images asynchronously without blocking response
            cdnService.preloadImages(publicIds).catch(error => {
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

/**
 * Middleware to add responsive image URLs to property responses
 */
export const responsiveImageMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      if (data && data.photoUrls && Array.isArray(data.photoUrls)) {
        // Generate responsive images asynchronously without blocking response
        Promise.all(
          data.photoUrls.slice(0, 5).map(async (url: string) => {
            const match = url.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp|gif)$/i);
            if (match) {
              const publicId = match[1];
              return await cdnService.getResponsiveImageUrls(publicId);
            }
            return { original: url };
          })
        ).then(responsiveImages => {
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

/**
 * Middleware to add CDN headers for better caching
 */
export const cdnHeadersMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
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