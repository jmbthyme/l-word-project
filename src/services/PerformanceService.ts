import type { PerformanceConfig } from '../types';

/**
 * PerformanceService handles optimization tasks including image compression,
 * memory management, and performance monitoring for the PDF Document Generator
 */
export class PerformanceService {
  private static instance: PerformanceService;
  private performanceConfig: PerformanceConfig;
  private imageCache: Map<string, string> = new Map();
  private compressionWorker: Worker | null = null;

  private constructor() {
    this.performanceConfig = {
      maxImageSize: 500 * 1024, // 500KB per image
      maxDatasetSize: 1000, // Maximum 1000 items
      fontCacheSize: 50, // Maximum 50 cached fonts
      pdfChunkSize: 100 // Process PDFs in chunks of 100 items
    };
  }

  /**
   * Get singleton instance of PerformanceService
   */
  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Compress and cache images for optimal PDF generation performance
   * @param images Map of filename to base64 image data
   * @returns Promise resolving to optimized images map
   */
  async compressAndCacheImages(images: Map<string, string>): Promise<Map<string, string>> {
    const startTime = performance.now();
    const optimizedImages = new Map<string, string>();
    const compressionPromises: Promise<void>[] = [];

    console.log(`Starting image compression for ${images.size} images...`);

    for (const [filename, imageData] of images.entries()) {
      // Check cache first
      const cacheKey = this.generateImageCacheKey(filename, imageData);
      if (this.imageCache.has(cacheKey)) {
        optimizedImages.set(filename, this.imageCache.get(cacheKey)!);
        continue;
      }

      const compressionPromise = this.compressSingleImage(filename, imageData)
        .then(compressedData => {
          optimizedImages.set(filename, compressedData);
          this.imageCache.set(cacheKey, compressedData);
        })
        .catch(error => {
          console.warn(`Failed to compress image ${filename}:`, error);
          // Use original image if compression fails
          optimizedImages.set(filename, imageData);
        });

      compressionPromises.push(compressionPromise);
    }

    await Promise.all(compressionPromises);

    const endTime = performance.now();
    console.log(`Image compression completed in ${Math.round(endTime - startTime)}ms`);

    // Clean up cache if it gets too large
    this.cleanupImageCache();

    return optimizedImages;
  }

  /**
   * Compress a single image using canvas-based compression
   * @param filename Image filename
   * @param imageData Base64 image data
   * @returns Promise resolving to compressed image data
   */
  private async compressSingleImage(filename: string, imageData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Calculate optimal dimensions
          const { width, height } = this.calculateOptimalDimensions(img.width, img.height);
          
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels until we meet size requirements
          let quality = 0.8;
          let compressedData: string;
          
          do {
            compressedData = canvas.toDataURL('image/jpeg', quality);
            const compressedSize = this.estimateBase64Size(compressedData);
            
            if (compressedSize <= this.performanceConfig.maxImageSize || quality <= 0.3) {
              break;
            }
            
            quality -= 0.1;
          } while (quality > 0.3);

          resolve(compressedData);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${filename}`));
      };

      img.src = imageData;
    });
  }

  /**
   * Calculate optimal image dimensions for PDF generation
   * @param originalWidth Original image width
   * @param originalHeight Original image height
   * @returns Object with optimized width and height
   */
  private calculateOptimalDimensions(originalWidth: number, originalHeight: number): { width: number; height: number } {
    const maxWidth = 800; // Maximum width for PDF images
    const maxHeight = 600; // Maximum height for PDF images
    
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // Scale down if image is too large
    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    return { width, height };
  }

  /**
   * Estimate the size of a base64 encoded string in bytes
   * @param base64String Base64 encoded string
   * @returns Estimated size in bytes
   */
  private estimateBase64Size(base64String: string): number {
    // Remove data URL prefix if present
    const base64Data = base64String.split(',')[1] || base64String;
    
    // Base64 encoding increases size by ~33%, so actual size is ~75% of encoded length
    return Math.round((base64Data.length * 3) / 4);
  }

  /**
   * Generate cache key for image based on filename and content hash
   * @param filename Image filename
   * @param imageData Base64 image data
   * @returns Cache key string
   */
  private generateImageCacheKey(filename: string, imageData: string): string {
    // Simple hash based on filename and data length
    const dataHash = this.simpleHash(imageData.substring(0, 100));
    return `${filename}_${dataHash}_${imageData.length}`;
  }

  /**
   * Simple hash function for cache keys
   * @param str String to hash
   * @returns Hash value
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Clean up image cache when it gets too large
   */
  private cleanupImageCache(): void {
    const maxCacheSize = 100; // Maximum number of cached images
    
    if (this.imageCache.size > maxCacheSize) {
      // Remove oldest entries (simple FIFO approach)
      const keysToRemove = Array.from(this.imageCache.keys()).slice(0, this.imageCache.size - maxCacheSize);
      keysToRemove.forEach(key => this.imageCache.delete(key));
      
      console.log(`Cleaned up image cache, removed ${keysToRemove.length} entries`);
    }
  }

  /**
   * Optimize dataset for PDF generation by chunking large datasets
   * @param data Array of data items
   * @returns Array of data chunks
   */
  optimizeDatasetForPDF<T>(data: T[]): T[][] {
    if (data.length <= this.performanceConfig.pdfChunkSize) {
      return [data];
    }

    const chunks: T[][] = [];
    for (let i = 0; i < data.length; i += this.performanceConfig.pdfChunkSize) {
      chunks.push(data.slice(i, i + this.performanceConfig.pdfChunkSize));
    }

    console.log(`Dataset chunked into ${chunks.length} chunks for optimal processing`);
    return chunks;
  }

  /**
   * Monitor memory usage and provide warnings
   * @returns Memory usage information
   */
  monitorMemoryUsage(): { used: number; total: number; percentage: number } {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const used = memInfo.usedJSHeapSize;
      const total = memInfo.totalJSHeapSize;
      const percentage = Math.round((used / total) * 100);

      if (percentage > 80) {
        console.warn(`High memory usage detected: ${percentage}% (${Math.round(used / 1024 / 1024)}MB used)`);
      }

      return { used, total, percentage };
    }

    return { used: 0, total: 0, percentage: 0 };
  }

  /**
   * Create a performance timer for measuring operation duration
   * @param operationName Name of the operation being timed
   * @returns Timer object with stop method
   */
  createTimer(operationName: string): { stop: () => number } {
    const startTime = performance.now();
    console.log(`Starting ${operationName}...`);

    return {
      stop: () => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        console.log(`${operationName} completed in ${duration}ms`);
        return duration;
      }
    };
  }

  /**
   * Preload and optimize fonts for better performance
   * @param fontFamilies Array of font family names
   * @returns Promise resolving when fonts are optimized
   */
  async optimizeFontLoading(fontFamilies: string[]): Promise<void> {
    const timer = this.createTimer('Font optimization');
    
    try {
      // Limit the number of fonts to prevent performance issues
      const limitedFonts = fontFamilies.slice(0, 10);
      
      if (limitedFonts.length < fontFamilies.length) {
        console.warn(`Font count limited to ${limitedFonts.length} for performance reasons`);
      }

      // Preload fonts with timeout
      const fontPromises = limitedFonts.map(family => 
        this.preloadFontWithTimeout(family, 5000) // 5 second timeout per font
      );

      await Promise.allSettled(fontPromises);
    } finally {
      timer.stop();
    }
  }

  /**
   * Preload a single font with timeout
   * @param fontFamily Font family name
   * @param timeout Timeout in milliseconds
   * @returns Promise that resolves when font is loaded or times out
   */
  private preloadFontWithTimeout(fontFamily: string, timeout: number): Promise<void> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn(`Font loading timeout for: ${fontFamily}`);
        resolve();
      }, timeout);

      // Try to load font
      const fontFace = new FontFace(fontFamily, `url(https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)})`);
      
      fontFace.load()
        .then(() => {
          clearTimeout(timeoutId);
          document.fonts.add(fontFace);
          resolve();
        })
        .catch(() => {
          clearTimeout(timeoutId);
          console.warn(`Failed to load font: ${fontFamily}`);
          resolve();
        });
    });
  }

  /**
   * Get current performance configuration
   * @returns Current PerformanceConfig
   */
  getConfig(): PerformanceConfig {
    return { ...this.performanceConfig };
  }

  /**
   * Update performance configuration
   * @param config Partial PerformanceConfig to update
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.performanceConfig = { ...this.performanceConfig, ...config };
    console.log('Performance configuration updated:', this.performanceConfig);
  }

  /**
   * Clear all caches and reset performance service
   */
  clearCaches(): void {
    this.imageCache.clear();
    console.log('Performance service caches cleared');
  }

  /**
   * Get cache statistics
   * @returns Object with cache statistics
   */
  getCacheStats(): { imageCache: number } {
    return {
      imageCache: this.imageCache.size
    };
  }
}