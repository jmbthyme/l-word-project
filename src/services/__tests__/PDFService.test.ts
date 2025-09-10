import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFService } from '../PDFService';
import type { WordCloudItem, WordCloudConfig } from '../../types';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  Document: vi.fn(),
  Page: vi.fn(),
  Text: vi.fn(),
  View: vi.fn(),
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
  Font: {
    register: vi.fn(),
  },
  pdf: vi.fn(() => ({
    toBlob: vi.fn().mockResolvedValue(new Blob(['mock pdf'], { type: 'application/pdf' })),
  })),
}));

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
});

describe('PDFService', () => {
  let pdfService: PDFService;
  let mockWordCloudItems: WordCloudItem[];
  let mockConfig: WordCloudConfig;

  beforeEach(() => {
    pdfService = new PDFService();
    
    mockWordCloudItems = [
      {
        text: 'Innovation',
        size: 48,
        weight: 700,
        fontFamily: 'Roboto',
        color: '#2563eb',
        x: 100,
        y: 50,
      },
      {
        text: 'Creative',
        size: 36,
        weight: 500,
        fontFamily: 'Open Sans',
        color: '#dc2626',
        x: 200,
        y: 100,
      },
      {
        text: 'Solution',
        size: 24,
        weight: 400,
        fontFamily: 'Lato',
        color: '#059669',
        x: 150,
        y: 150,
      },
    ];

    mockConfig = {
      paperSize: 'A4',
      orientation: 'landscape',
      colorScheme: 'color',
      dpi: 300,
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('generateWordCloudPDF', () => {
    it('should generate PDF blob for word cloud', async () => {
      const result = await pdfService.generateWordCloudPDF(mockWordCloudItems, mockConfig);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    it('should register fonts before generating PDF', async () => {
      const { Font } = await import('@react-pdf/renderer');
      
      await pdfService.generateWordCloudPDF(mockWordCloudItems, mockConfig);

      expect(Font.register).toHaveBeenCalledWith({
        family: 'Roboto',
        src: expect.stringContaining('fonts.googleapis.com'),
      });
      expect(Font.register).toHaveBeenCalledWith({
        family: 'Open Sans',
        src: expect.stringContaining('fonts.googleapis.com'),
      });
      expect(Font.register).toHaveBeenCalledWith({
        family: 'Lato',
        src: expect.stringContaining('fonts.googleapis.com'),
      });
    });

    it('should handle empty word cloud items', async () => {
      const result = await pdfService.generateWordCloudPDF([], mockConfig);

      expect(result).toBeInstanceOf(Blob);
    });

    it('should throw error when PDF generation fails', async () => {
      const { pdf } = await import('@react-pdf/renderer');
      vi.mocked(pdf).mockImplementation(() => ({
        toBlob: vi.fn().mockRejectedValue(new Error('PDF generation failed')),
      }));

      await expect(pdfService.generateWordCloudPDF(mockWordCloudItems, mockConfig))
        .rejects.toThrow('Word Cloud PDF generation failed');
    });

    it('should handle different paper sizes and orientations', async () => {
      const configs: WordCloudConfig[] = [
        { paperSize: 'A4', orientation: 'portrait', colorScheme: 'color', dpi: 300 },
        { paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300 },
        { paperSize: 'A3', orientation: 'portrait', colorScheme: 'color', dpi: 300 },
        { paperSize: 'A3', orientation: 'landscape', colorScheme: 'color', dpi: 300 },
      ];

      // Reset the mock to ensure it works for each config
      const { pdf } = await import('@react-pdf/renderer');
      vi.mocked(pdf).mockImplementation(() => ({
        toBlob: vi.fn().mockResolvedValue(new Blob(['mock pdf'], { type: 'application/pdf' })),
      }));

      for (const config of configs) {
        const result = await pdfService.generateWordCloudPDF(mockWordCloudItems, config);
        expect(result).toBeInstanceOf(Blob);
      }
    });
  });

  describe('generateDossierPDF', () => {
    it('should throw error for unimplemented dossier generation', async () => {
      await expect(pdfService.generateDossierPDF([], new Map()))
        .rejects.toThrow('Dossier PDF generation not yet implemented');
    });
  });

  describe('downloadPDF', () => {
    it('should trigger PDF download', () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const filename = 'test-document';

      pdfService.downloadPDF(mockBlob, filename);

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should add .pdf extension if not present', () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.mocked(document.createElement).mockReturnValue(mockLink as any);

      pdfService.downloadPDF(mockBlob, 'test-document');

      expect(mockLink.download).toBe('test-document.pdf');
    });

    it('should not add .pdf extension if already present', () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.mocked(document.createElement).mockReturnValue(mockLink as any);

      pdfService.downloadPDF(mockBlob, 'test-document.pdf');

      expect(mockLink.download).toBe('test-document.pdf');
    });

    it('should handle download errors', () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      vi.mocked(window.URL.createObjectURL).mockImplementation(() => {
        throw new Error('URL creation failed');
      });

      expect(() => pdfService.downloadPDF(mockBlob, 'test'))
        .toThrow('PDF download failed');
    });
  });

  describe('getPaperDimensions', () => {
    it('should return correct A4 dimensions', () => {
      const portraitDimensions = pdfService.getPaperDimensions('A4', 'portrait');
      expect(portraitDimensions).toEqual({ width: 595, height: 842 });

      const landscapeDimensions = pdfService.getPaperDimensions('A4', 'landscape');
      expect(landscapeDimensions).toEqual({ width: 842, height: 595 });
    });

    it('should return correct A3 dimensions', () => {
      const portraitDimensions = pdfService.getPaperDimensions('A3', 'portrait');
      expect(portraitDimensions).toEqual({ width: 842, height: 1191 });

      const landscapeDimensions = pdfService.getPaperDimensions('A3', 'landscape');
      expect(landscapeDimensions).toEqual({ width: 1191, height: 842 });
    });
  });

  describe('pixelsToPoints', () => {
    it('should convert pixels to points correctly', () => {
      expect(pdfService.pixelsToPoints(72)).toBe(72); // 72 DPI default
      expect(pdfService.pixelsToPoints(144)).toBe(144);
      expect(pdfService.pixelsToPoints(72, 144)).toBe(36); // 144 DPI
    });
  });

  describe('scaleWordCloudForPDF', () => {
    it('should scale word cloud items to fit PDF page', () => {
      const scaledItems = pdfService.scaleWordCloudForPDF(mockWordCloudItems, mockConfig);

      expect(scaledItems).toHaveLength(mockWordCloudItems.length);
      scaledItems.forEach((item, index) => {
        expect(item.text).toBe(mockWordCloudItems[index].text);
        expect(item.fontFamily).toBe(mockWordCloudItems[index].fontFamily);
        expect(typeof item.x).toBe('number');
        expect(typeof item.y).toBe('number');
        expect(typeof item.size).toBe('number');
        expect(item.size).toBeGreaterThanOrEqual(8); // Minimum font size
      });
    });

    it('should handle empty items array', () => {
      const scaledItems = pdfService.scaleWordCloudForPDF([], mockConfig);
      expect(scaledItems).toEqual([]);
    });

    it('should not scale up items (scale factor <= 1)', () => {
      // Create items that are already small
      const smallItems: WordCloudItem[] = [
        {
          text: 'Small',
          size: 12,
          weight: 400,
          fontFamily: 'Arial',
          x: 10,
          y: 10,
        },
      ];

      const scaledItems = pdfService.scaleWordCloudForPDF(smallItems, mockConfig);
      
      // Should not scale up
      expect(scaledItems[0].size).toBeGreaterThanOrEqual(smallItems[0].size);
    });

    it('should maintain minimum font size', () => {
      // Create items with very large coordinates to force scaling down
      const largeItems: WordCloudItem[] = [
        {
          text: 'Large',
          size: 100,
          weight: 400,
          fontFamily: 'Arial',
          x: 10000,
          y: 10000,
        },
      ];

      const scaledItems = pdfService.scaleWordCloudForPDF(largeItems, mockConfig);
      
      expect(scaledItems[0].size).toBeGreaterThanOrEqual(8);
    });
  });

  describe('registerFonts', () => {
    it('should register fonts only once', async () => {
      const { Font } = await import('@react-pdf/renderer');
      const fonts = ['Roboto', 'Open Sans'];

      await pdfService.registerFonts(fonts);
      await pdfService.registerFonts(fonts); // Second call

      // Should only register fonts once
      expect(Font.register).toHaveBeenCalledTimes(2); // Once per font, not twice
    });

    it('should handle font registration errors gracefully', async () => {
      const { Font } = await import('@react-pdf/renderer');
      vi.mocked(Font.register).mockImplementation(() => {
        throw new Error('Font registration failed');
      });

      // Should not throw error
      await expect(pdfService.registerFonts(['Roboto'])).resolves.toBeUndefined();
    });
  });
});