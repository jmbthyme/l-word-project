import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FontService } from '../FontService';
import type { GoogleFont } from '../../types';

// Mock environment variable
vi.mock('import.meta.env', () => ({
  VITE_GOOGLE_FONTS_API_KEY: 'test-api-key'
}));

// Mock DOM methods
const mockAppendChild = vi.fn();
const mockQuerySelector = vi.fn();

Object.defineProperty(document, 'head', {
  value: {
    appendChild: mockAppendChild
  },
  writable: true
});

Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName: string) => {
    if (tagName === 'link') {
      return {
        rel: '',
        href: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null
      };
    }
    return {};
  }),
  writable: true
});

describe('FontService', () => {
  let fontService: FontService;

  beforeEach(() => {
    fontService = new FontService();
    vi.clearAllMocks();
    mockQuerySelector.mockReturnValue(null); // No existing font links by default
  });

  afterEach(() => {
    fontService.clearCache();
  });

  describe('getRandomFontCombination', () => {
    it('should return the requested number of fonts', () => {
      const fonts = fontService.getRandomFontCombination(3);
      expect(fonts).toHaveLength(3);
    });

    it('should return unique fonts', () => {
      const fonts = fontService.getRandomFontCombination(5);
      const fontFamilies = fonts.map(font => font.family);
      const uniqueFamilies = new Set(fontFamilies);
      expect(uniqueFamilies.size).toBe(fonts.length);
    });

    it('should not return more fonts than available', () => {
      const availableFonts = fontService.getAvailableFonts();
      const fonts = fontService.getRandomFontCombination(availableFonts.length + 10);
      expect(fonts.length).toBeLessThanOrEqual(availableFonts.length);
    });

    it('should return valid GoogleFont objects', () => {
      const fonts = fontService.getRandomFontCombination(2);
      fonts.forEach(font => {
        expect(font).toHaveProperty('family');
        expect(font).toHaveProperty('weights');
        expect(typeof font.family).toBe('string');
        expect(Array.isArray(font.weights)).toBe(true);
        expect(font.weights.length).toBeGreaterThan(0);
      });
    });

    it('should handle edge case of requesting 0 fonts', () => {
      const fonts = fontService.getRandomFontCombination(0);
      expect(fonts).toHaveLength(0);
    });
  });

  describe('getRandomWeight', () => {
    it('should return a weight from the font\'s available weights', () => {
      const testFont: GoogleFont = {
        family: 'Test Font',
        weights: [300, 400, 700]
      };
      
      const weight = fontService.getRandomWeight(testFont);
      expect(testFont.weights).toContain(weight);
    });

    it('should handle font with single weight', () => {
      const testFont: GoogleFont = {
        family: 'Single Weight Font',
        weights: [400]
      };
      
      const weight = fontService.getRandomWeight(testFont);
      expect(weight).toBe(400);
    });
  });

  describe('loadGoogleFonts', () => {
    it('should create link elements for new fonts', async () => {
      const mockLink = {
        rel: '',
        href: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null
      };
      
      (document.createElement as any).mockReturnValue(mockLink);
      
      const loadPromise = fontService.loadGoogleFonts(['Roboto']);
      
      // Simulate successful font loading
      if (mockLink.onload) {
        mockLink.onload();
      }
      
      await loadPromise;
      
      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.rel).toBe('stylesheet');
      expect(mockLink.href).toContain('Roboto');
    });

    it('should not load fonts that are already loaded', async () => {
      // First load
      const mockLink1 = {
        rel: '',
        href: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null
      };
      
      (document.createElement as any).mockReturnValue(mockLink1);
      
      const firstLoad = fontService.loadGoogleFonts(['Roboto']);
      if (mockLink1.onload) {
        mockLink1.onload();
      }
      await firstLoad;
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Second load - should not create new link
      await fontService.loadGoogleFonts(['Roboto']);
      
      expect(document.createElement).not.toHaveBeenCalled();
      expect(mockAppendChild).not.toHaveBeenCalled();
    });

    it('should handle font loading errors', async () => {
      const mockLink = {
        rel: '',
        href: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null
      };
      
      (document.createElement as any).mockReturnValue(mockLink);
      
      const loadPromise = fontService.loadGoogleFonts(['InvalidFont']);
      
      // Simulate font loading error
      if (mockLink.onerror) {
        mockLink.onerror();
      }
      
      await expect(loadPromise).rejects.toThrow('Font loading failed');
    });

    it('should skip loading if font link already exists', async () => {
      mockQuerySelector.mockReturnValue({}); // Simulate existing link
      
      await fontService.loadGoogleFonts(['Roboto']);
      
      expect(document.createElement).not.toHaveBeenCalled();
      expect(mockAppendChild).not.toHaveBeenCalled();
    });
  });

  describe('preloadFontsForWordCloud', () => {
    it('should return fonts based on word count', async () => {
      const mockLinks: any[] = [];
      
      (document.createElement as any).mockImplementation((tagName: string) => {
        if (tagName === 'link') {
          const mockLink = {
            rel: '',
            href: '',
            onload: null as (() => void) | null,
            onerror: null as (() => void) | null
          };
          mockLinks.push(mockLink);
          return mockLink;
        }
        return {};
      });
      
      const loadPromise = fontService.preloadFontsForWordCloud(10);
      
      // Simulate successful font loading for all created links
      setTimeout(() => {
        mockLinks.forEach(link => {
          if (link.onload) {
            link.onload();
          }
        });
      }, 0);
      
      const fonts = await loadPromise;
      
      expect(fonts.length).toBeGreaterThan(0);
      expect(fonts.length).toBeLessThanOrEqual(fontService.getAvailableFonts().length);
    });

    it('should return at least 3 fonts for small word counts', async () => {
      const mockLinks: any[] = [];
      
      (document.createElement as any).mockImplementation((tagName: string) => {
        if (tagName === 'link') {
          const mockLink = {
            rel: '',
            href: '',
            onload: null as (() => void) | null,
            onerror: null as (() => void) | null
          };
          mockLinks.push(mockLink);
          return mockLink;
        }
        return {};
      });
      
      const loadPromise = fontService.preloadFontsForWordCloud(5);
      
      // Simulate successful font loading for all created links
      setTimeout(() => {
        mockLinks.forEach(link => {
          if (link.onload) {
            link.onload();
          }
        });
      }, 0);
      
      const fonts = await loadPromise;
      
      expect(fonts.length).toBeGreaterThanOrEqual(3);
    });

    it('should return fallback fonts on loading failure', async () => {
      const mockLink = {
        rel: '',
        href: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null
      };
      
      (document.createElement as any).mockReturnValue(mockLink);
      
      const loadPromise = fontService.preloadFontsForWordCloud(10);
      
      // Simulate font loading error
      if (mockLink.onerror) {
        mockLink.onerror();
      }
      
      const fonts = await loadPromise;
      
      expect(fonts.length).toBeGreaterThan(0);
      expect(fonts.every(font => ['Roboto', 'Open Sans', 'Lato'].includes(font.family))).toBe(true);
    });
  });

  describe('isFontLoaded', () => {
    it('should return false for unloaded fonts', () => {
      expect(fontService.isFontLoaded('Roboto')).toBe(false);
    });

    it('should return true for loaded fonts', async () => {
      const mockLink = {
        rel: '',
        href: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null
      };
      
      (document.createElement as any).mockReturnValue(mockLink);
      
      const loadPromise = fontService.loadGoogleFonts(['Roboto']);
      
      // Simulate successful font loading
      if (mockLink.onload) {
        mockLink.onload();
      }
      
      await loadPromise;
      
      expect(fontService.isFontLoaded('Roboto')).toBe(true);
    });
  });

  describe('getAvailableFonts', () => {
    it('should return an array of GoogleFont objects', () => {
      const fonts = fontService.getAvailableFonts();
      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
      
      fonts.forEach(font => {
        expect(font).toHaveProperty('family');
        expect(font).toHaveProperty('weights');
        expect(typeof font.family).toBe('string');
        expect(Array.isArray(font.weights)).toBe(true);
      });
    });

    it('should return a copy of the fonts array', () => {
      const fonts1 = fontService.getAvailableFonts();
      const fonts2 = fontService.getAvailableFonts();
      
      expect(fonts1).not.toBe(fonts2); // Different array instances
      expect(fonts1).toEqual(fonts2); // Same content
    });
  });

  describe('clearCache', () => {
    it('should clear font cache and loaded fonts', async () => {
      const mockLink = {
        rel: '',
        href: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null
      };
      
      (document.createElement as any).mockReturnValue(mockLink);
      
      const loadPromise = fontService.loadGoogleFonts(['Roboto']);
      
      // Simulate successful font loading
      if (mockLink.onload) {
        mockLink.onload();
      }
      
      await loadPromise;
      
      expect(fontService.isFontLoaded('Roboto')).toBe(true);
      
      fontService.clearCache();
      
      expect(fontService.isFontLoaded('Roboto')).toBe(false);
    });
  });

  describe('getCachedFont', () => {
    it('should return undefined for uncached fonts', () => {
      expect(fontService.getCachedFont('Roboto')).toBeUndefined();
    });

    it('should return cached font data after loading', async () => {
      const mockLink = {
        rel: '',
        href: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null
      };
      
      (document.createElement as any).mockReturnValue(mockLink);
      
      const loadPromise = fontService.loadGoogleFonts(['Roboto']);
      
      // Simulate successful font loading
      if (mockLink.onload) {
        mockLink.onload();
      }
      
      await loadPromise;
      
      const cachedFont = fontService.getCachedFont('Roboto');
      expect(cachedFont).toBeDefined();
      expect(cachedFont?.family).toBe('Roboto');
      expect(Array.isArray(cachedFont?.weights)).toBe(true);
    });
  });
});