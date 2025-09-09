import type { GoogleFont } from '../types';

/**
 * FontService handles Google Fonts integration, loading, caching, and selection
 * for the PDF Document Generator application.
 */
export class FontService {
  private fontCache: Map<string, GoogleFont> = new Map();
  private loadedFonts: Set<string> = new Set();
  private readonly GOOGLE_FONTS_API_KEY = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;
  private readonly GOOGLE_FONTS_BASE_URL = 'https://fonts.googleapis.com/css2';

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
   * Load Google Fonts by family names
   * @param families Array of font family names to load
   * @returns Promise that resolves when fonts are loaded
   */
  async loadGoogleFonts(families: string[]): Promise<void> {
    const fontsToLoad = families.filter(family => !this.loadedFonts.has(family));
    
    if (fontsToLoad.length === 0) {
      return;
    }

    try {
      // Create font face declarations for each font
      const fontPromises = fontsToLoad.map(family => this.loadSingleFont(family));
      await Promise.all(fontPromises);
      
      // Mark fonts as loaded
      fontsToLoad.forEach(family => this.loadedFonts.add(family));
    } catch (error) {
      console.error('Failed to load Google Fonts:', error);
      throw new Error(`Font loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a single font family
   * @param family Font family name
   * @returns Promise that resolves when font is loaded
   */
  private async loadSingleFont(family: string): Promise<void> {
    const fontData = this.WORD_CLOUD_FONTS.find(font => font.family === family);
    if (!fontData) {
      throw new Error(`Font family "${family}" not found in available fonts`);
    }

    // Create CSS link for Google Fonts
    const weightsParam = fontData.weights.join(';');
    const fontUrl = `${this.GOOGLE_FONTS_BASE_URL}?family=${encodeURIComponent(family)}:wght@${weightsParam}&display=swap`;
    
    return new Promise((resolve, reject) => {
      // Check if font link already exists
      const existingLink = document.querySelector(`link[href*="${encodeURIComponent(family)}"]`);
      if (existingLink) {
        resolve();
        return;
      }

      // Create and append font link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      
      link.onload = () => {
        // Cache the font data
        this.fontCache.set(family, fontData);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load font: ${family}`));
      };
      
      document.head.appendChild(link);
    });
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
   * Preload fonts specifically for word cloud generation
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
      return selectedFonts;
    } catch (error) {
      console.error('Failed to preload fonts for word cloud:', error);
      // Return a fallback set of basic fonts
      return this.getFallbackFonts();
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