import { v2 as cloudinary } from 'cloudinary';
import redisService from './redisService';

/**
 * CDN Service for optimizing static asset delivery
 * Integrates with Cloudinary for image optimization and caching
 */
export class CDNService {
  private static instance: CDNService;
  private readonly CDN_CACHE_TTL = 24 * 60 * 60; // 24 hours
  private readonly IMAGE_TRANSFORMATIONS = {
    thumbnail: { width: 300, height: 200, crop: 'fill', quality: 'auto', format: 'webp' },
    medium: { width: 800, height: 600, crop: 'fill', quality: 'auto', format: 'webp' },
    large: { width: 1200, height: 900, crop: 'fill', quality: 'auto', format: 'webp' },
    hero: { width: 1920, height: 1080, crop: 'fill', quality: 'auto', format: 'webp' }
  };

  private constructor() {
    this.initializeCloudinary();
  }

  public static getInstance(): CDNService {
    if (!CDNService.instance) {
      CDNService.instance = new CDNService();
    }
    return CDNService.instance;
  }

  private initializeCloudinary(): void {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }

  /**
   * Generate optimized image URLs with caching
   */
  public async getOptimizedImageUrl(
    publicId: string,
    transformation: keyof typeof this.IMAGE_TRANSFORMATIONS = 'medium',
    options: { cache?: boolean } = { cache: true }
  ): Promise<string> {
    const cacheKey = `cdn:image:${publicId}:${transformation}`;
    
    if (options.cache) {
      const cachedUrl = await redisService.get(cacheKey);
      if (cachedUrl) {
        return cachedUrl;
      }
    }

    const transformationConfig = this.IMAGE_TRANSFORMATIONS[transformation];
    const optimizedUrl = cloudinary.url(publicId, {
      ...transformationConfig,
      fetch_format: 'auto',
      quality: 'auto:good',
      flags: 'progressive'
    });

    if (options.cache) {
      await redisService.set(cacheKey, optimizedUrl, this.CDN_CACHE_TTL);
    }

    return optimizedUrl;
  }

  /**
   * Generate multiple image sizes for responsive design
   */
  public async getResponsiveImageUrls(
    publicId: string,
    sizes: Array<keyof typeof this.IMAGE_TRANSFORMATIONS> = ['thumbnail', 'medium', 'large']
  ): Promise<Record<string, string>> {
    const urls: Record<string, string> = {};
    
    await Promise.all(
      sizes.map(async (size) => {
        urls[size] = await this.getOptimizedImageUrl(publicId, size);
      })
    );

    return urls;
  }

  /**
   * Preload critical images for better performance
   */
  public async preloadImages(publicIds: string[]): Promise<void> {
    const preloadPromises = publicIds.map(async (publicId) => {
      // Preload thumbnail and medium sizes
      await Promise.all([
        this.getOptimizedImageUrl(publicId, 'thumbnail'),
        this.getOptimizedImageUrl(publicId, 'medium')
      ]);
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Generate video streaming URLs with optimization
   */
  public getOptimizedVideoUrl(
    publicId: string,
    options: {
      quality?: 'auto' | 'low' | 'medium' | 'high';
      format?: 'mp4' | 'webm' | 'auto';
      width?: number;
      height?: number;
    } = {}
  ): string {
    const { quality = 'auto', format = 'auto', width, height } = options;
    
    return cloudinary.url(publicId, {
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
  public async invalidateCache(publicIds: string[]): Promise<void> {
    const invalidationPromises = publicIds.map(async (publicId) => {
      const transformations = Object.keys(this.IMAGE_TRANSFORMATIONS);
      const cacheKeys = transformations.map(t => `cdn:image:${publicId}:${t}`);
      
      await Promise.all(
        cacheKeys.map(key => redisService.del(key))
      );
    });

    await Promise.all(invalidationPromises);
  }

  /**
   * Get CDN statistics and performance metrics
   */
  public async getCDNStats(): Promise<{
    cacheHitRate: number;
    totalRequests: number;
    bandwidthSaved: number;
  }> {
    const stats = await redisService.get('cdn:stats');
    return stats ? JSON.parse(stats) : {
      cacheHitRate: 0,
      totalRequests: 0,
      bandwidthSaved: 0
    };
  }

  /**
   * Update CDN statistics
   */
  public async updateStats(hit: boolean, bandwidthSaved: number = 0): Promise<void> {
    const currentStats = await this.getCDNStats();
    const newStats = {
      cacheHitRate: hit 
        ? (currentStats.cacheHitRate * currentStats.totalRequests + 1) / (currentStats.totalRequests + 1)
        : (currentStats.cacheHitRate * currentStats.totalRequests) / (currentStats.totalRequests + 1),
      totalRequests: currentStats.totalRequests + 1,
      bandwidthSaved: currentStats.bandwidthSaved + bandwidthSaved
    };

    await redisService.set('cdn:stats', JSON.stringify(newStats), this.CDN_CACHE_TTL);
  }
}

export const cdnService = CDNService.getInstance();