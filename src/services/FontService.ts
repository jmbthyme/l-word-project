import type { GoogleFont } from '../types';
import { PerformanceService } from './PerformanceService';
import { ErrorHandlingService } from './ErrorHandlingService';

/**
 * FontService handles Google Fonts integration, loading, caching, and selection
 * for the PDF Document Generator application.
 */
export class FontService {
  private fontCache: Map<string, GoogleFont> = new Map();
  private loadedFonts: Set<string> = new Set();
  private failedFonts: Set<string> = new Set();
  private readonly GOOGLE_FONTS_API_KEY = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;
  private readonly GOOGLE_FONTS_BASE_URL = 'https://fonts.googleapis.com/css2';
  private performanceService = PerformanceService.getInstance();
  private errorService = ErrorHandlingService.getInstance();

  // Curated list of fonts suitable for word clouds
  private readonly WORD_CLOUD_FONTS: GoogleFont[] = [
    { family: 'Roboto', weights: [300, 400, 500, 700, 900] },
    { family: 'Open Sans', weights: [300, 400, 600, 700, 800] },
    { family: 'Lato', weights: [300, 400, 700, 900] },
    { family: 'Montserrat', weights: [300, 400, 500, 600, 700, 800, 900] },
    { family: 'Poppins', weights: [300, 400, 500, 600, 700, 800, 900] },
    { family: 'Source Sans Pro', weights: [300, 400, 600, 700, 900] },
    { family: 'Oswald', weights: [300, 400, 500, 600, 700] },
    { family: 'Raleway', weights: [300, 400, 500, 600, 700, 800, 900] },
    { family: 'Nunito', weights: [300, 400, 600, 700, 800, 900] },
    { family: 'Playfair Display', weights: [400, 500, 600, 700, 800, 900] },
    { family: 'Merriweather', weights: [300, 400, 700, 900] },
    { family: 'PT Sans', weights: [400, 700] },
    { family: 'Ubuntu', weights: [300, 400, 500, 700] },
    { family: 'Crimson Text', weights: [400, 600, 700] },
    { family: 'Libre Baskerville', weights: [400, 700] }
  ];

  /**
   * Load Google Fonts by family names with performance optimizations and retry mechanism
   * @param families Array of font family names to load
   * @returns Promise that resolves when fonts are loaded
   */
  async loadGoogleFonts(families: string[]): Promise<void> {
    const timer = this.performanceService.createTimer('Font Loading');
    
    try {
      const fontsToLoad = families.filter(family => 
        !this.loadedFonts.has(family) && !this.failedFonts.has(family)
      );

      if (fontsToLoad.length === 0) {
        return;
      }

      // Limit font loading for performance
      const maxFonts = this.performanceService.getConfig().fontCacheSize;
      const limitedFonts = fontsToLoad.slice(0, Math.min(maxFonts, 10));

      if (limitedFonts.length < fontsToLoad.length) {
        console.warn(`Font loading limited to ${limitedFonts.length} fonts for performance`);
      }

      // Load fonts with retry mechanism
      const fontPromises = limitedFonts.map(family => 
        this.errorService.withRetry(
          () => this.loadSingleFontWithTimeout(family, 3000),
          2, // Max 2 retries
          1000, // 1 second delay
          `Font Loading: ${family}`
        ).catch(error => {
          this.failedFonts.add(family);
          this.errorService.handleFontLoadError(family, error);
          return null; // Don't fail the entire operation
        })
      );
      
      const results = await Promise.allSettled(fontPromises);
      
      // Mark successfully loaded fonts
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          this.loadedFonts.add(limitedFonts[index]);
        }
      });

      // Clean up font cache if needed
      this.cleanupFontCache();
    } finally {
      timer.stop();
    }
  }

  /**
   * Load a single font family with timeout protection
   * @param family Font family name
   * @param timeoutMs Timeout in milliseconds
   * @returns Promise that resolves when font is loaded or times out
   */
  private async loadSingleFontWithTimeout(family: string, timeoutMs: number): Promise<void> {
    const fontData = this.WORD_CLOUD_FONTS.find(font => font.family === family);
    if (!fontData) {
      throw new Error(`Font family "${family}" not found in available fonts`);
    }

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Font loading timeout for: ${family}`));
      }, timeoutMs);

      // Check if font link already exists
      const existingLink = document.querySelector(`link[href*="${encodeURIComponent(family)}"]`);
      if (existingLink) {
        clearTimeout(timeoutId);
        this.fontCache.set(family, fontData);
        resolve();
        return;
      }

      // Create CSS link for Google Fonts with optimized weights
      const essentialWeights = this.getEssentialWeights(fontData.weights);
      const weightsParam = essentialWeights.join(';');
      const fontUrl = `${this.GOOGLE_FONTS_BASE_URL}?family=${encodeURIComponent(family)}:wght@${weightsParam}&display=swap`;

      // Create and append font link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;

      link.onload = () => {
        clearTimeout(timeoutId);
        // Cache the font data
        this.fontCache.set(family, fontData);
        resolve();
      };

      link.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load font: ${family}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Get essential font weights to reduce loading time
   * @param weights Array of available weights
   * @returns Array of essential weights
   */
  private getEssentialWeights(weights: number[]): number[] {
    // Prioritize common weights for better performance
    const essentialWeights = [400, 700]; // Normal and bold
    const availableEssential = essentialWeights.filter(weight => weights.includes(weight));
    
    // If essential weights aren't available, use the first few available weights
    if (availableEssential.length === 0) {
      return weights.slice(0, 3); // Maximum 3 weights for performance
    }
    
    // Add one more weight if available for variety
    const additionalWeight = weights.find(w => !essentialWeights.includes(w));
    if (additionalWeight) {
      availableEssential.push(additionalWeight);
    }
    
    return availableEssential;
  }

  /**
   * Clean up font cache when it gets too large
   */
  private cleanupFontCache(): void {
    const maxCacheSize = this.performanceService.getConfig().fontCacheSize;
    
    if (this.fontCache.size > maxCacheSize) {
      // Remove oldest entries (simple FIFO approach)
      const keysToRemove = Array.from(this.fontCache.keys()).slice(0, this.fontCache.size - maxCacheSize);
      keysToRemove.forEach(key => {
        this.fontCache.delete(key);
        this.loadedFonts.delete(key);
      });
      
      console.log(`Cleaned up font cache, removed ${keysToRemove.length} entries`);
    }
  }

  /**
   * Get a random combination of fonts for word cloud diversity
   * @param count Number of fonts to select (default: 5)
   * @returns Array of randomly selected GoogleFont objects
   */
  getRandomFontCombination(count: number = 5): GoogleFont[] {
    const availableFonts = [...this.WORD_CLOUD_FONTS];
    const selectedFonts: GoogleFont[] = [];

    // Ensure we don't request more fonts than available
    const actualCount = Math.min(count, availableFonts.length);

    for (let i = 0; i < actualCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableFonts.length);
      const selectedFont = availableFonts.splice(randomIndex, 1)[0];
      selectedFonts.push(selectedFont);
    }

    return selectedFonts;
  }

  /**
   * Preload fonts specifically for word cloud generation with fallback handling
   * @param wordCount Number of words in the word cloud
   * @returns Promise resolving to array of loaded GoogleFont objects
   */
  async preloadFontsForWordCloud(wordCount: number): Promise<GoogleFont[]> {
    // Calculate optimal number of fonts based on word count
    // Use more variety for larger word clouds, but cap at available fonts
    const fontCount = Math.min(
      Math.max(3, Math.ceil(wordCount / 5)), // At least 3 fonts, more for larger clouds
      this.WORD_CLOUD_FONTS.length
    );

    const selectedFonts = this.getRandomFontCombination(fontCount);
    const fontFamilies = selectedFonts.map(font => font.family);

    try {
      await this.loadGoogleFonts(fontFamilies);
      
      // Filter out fonts that failed to load and return available ones
      const availableFonts = selectedFonts.filter(font => 
        this.loadedFonts.has(font.family)
      );
      
      // If we have at least one font, return what we have
      if (availableFonts.length > 0) {
        return availableFonts;
      }
      
      // If no fonts loaded, try fallback fonts
      const fallbackFonts = this.getFallbackFonts();
      const fallbackFamilies = fallbackFonts.map(font => font.family);
      
      await this.loadGoogleFonts(fallbackFamilies);
      
      // Return whatever fallback fonts we could load
      return fallbackFonts.filter(font => 
        this.loadedFonts.has(font.family)
      );
      
    } catch (error) {
      console.error('Failed to preload fonts for word cloud:', error);
      this.errorService.handleFontLoadError('word-cloud-fonts', error as Error);
      
      // Return system fonts as last resort
      return this.getSystemFallbackFonts();
    }
  }

  /**
   * Get a fallback set of fonts that should be available on most systems
   * @returns Array of fallback GoogleFont objects
   */
  private getFallbackFonts(): GoogleFont[] {
    return [
      { family: 'Roboto', weights: [300, 400, 700] },
      { family: 'Open Sans', weights: [400, 600, 700] },
      { family: 'Lato', weights: [400, 700] }
    ];
  }

  /**
   * Get system fonts as absolute fallback when Google Fonts fail
   * @returns Array of system font objects
   */
  private getSystemFallbackFonts(): GoogleFont[] {
    return [
      { family: 'Arial', weights: [400, 700] },
      { family: 'Helvetica', weights: [400, 700] },
      { family: 'Times New Roman', weights: [400, 700] },
      { family: 'Georgia', weights: [400, 700] }
    ];
  }

  /**
   * Get a random font weight from a font's available weights
   * @param font GoogleFont object
   * @returns Random weight value
   */
  getRandomWeight(font: GoogleFont): number {
    const randomIndex = Math.floor(Math.random() * font.weights.length);
    return font.weights[randomIndex];
  }

  /**
   * Check if a font family is loaded
   * @param family Font family name
   * @returns Boolean indicating if font is loaded
   */
  isFontLoaded(family: string): boolean {
    return this.loadedFonts.has(family);
  }

  /**
   * Get all available word cloud fonts
   * @returns Array of all available GoogleFont objects
   */
  getAvailableFonts(): GoogleFont[] {
    return [...this.WORD_CLOUD_FONTS];
  }

  /**
   * Clear font cache and loaded fonts tracking
   */
  clearCache(): void {
    this.fontCache.clear();
    this.loadedFonts.clear();
    this.failedFonts.clear();
  }

  /**
   * Get font loading statistics
   */
  getFontStats(): { loaded: number; failed: number; cached: number } {
    return {
      loaded: this.loadedFonts.size,
      failed: this.failedFonts.size,
      cached: this.fontCache.size
    };
  }

  /**
   * Get cached font data
   * @param family Font family name
   * @returns GoogleFont object if cached, undefined otherwise
   */
  getCachedFont(family: string): GoogleFont | undefined {
    return this.fontCache.get(family);
  }
}