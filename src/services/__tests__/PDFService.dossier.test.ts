import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFService } from '../PDFService';
import type { PersonData } from '../../types';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => {
  const mockPdf = vi.fn();
  const mockToBlob = vi.fn();
  
  return {
    Document: vi.fn(),
    Page: vi.fn(),
    Text: vi.fn(),
    View: vi.fn(),
    Image: vi.fn(),
    StyleSheet: {
      create: vi.fn((styles) => styles),
    },
    Font: {
      register: vi.fn(),
    },
    pdf: mockPdf,
  };
});

// Mock the DossierGenerator component
vi.mock('../../components/DossierGenerator', () => ({
  DossierGenerator: vi.fn(() => null),
}));

describe('PDFService - Dossier Generation', () => {
  let pdfService: PDFService;
  let mockPdf: any;
  let mockToBlob: any;
  
  const mockPersonData: PersonData[] = [
    {
      person: 'John Doe',
      word: 'Innovation',
      description: 'A forward-thinking individual who brings creative solutions to complex problems.',
      picture: 'john_doe.jpg'
    },
    {
      person: 'Jane Smith',
      word: 'Leadership',
      description: 'An inspiring leader who motivates teams to achieve exceptional results.',
      picture: 'jane_smith.jpg'
    }
  ];

  const mockImages = new Map([
    ['john_doe.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='],
    ['jane_smith.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=']
  ]);

  beforeEach(async () => {
    pdfService = new PDFService();
    vi.clearAllMocks();
    
    // Get the mocked functions
    const { pdf } = await import('@react-pdf/renderer');
    mockPdf = pdf as any;
    mockToBlob = vi.fn();
    
    // Setup mock return values
    mockToBlob.mockResolvedValue(new Blob(['mock pdf content'], { type: 'application/pdf' }));
    mockPdf.mockReturnValue({ toBlob: mockToBlob });
  });

  describe('generateDossierPDF', () => {
    it('should generate PDF blob successfully', async () => {
      const result = await pdfService.generateDossierPDF(mockPersonData, mockImages);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
      expect(mockPdf).toHaveBeenCalledTimes(1);
      expect(mockToBlob).toHaveBeenCalledTimes(1);
    });

    it('should call PDF generation with component', async () => {
      await pdfService.generateDossierPDF(mockPersonData, mockImages);

      // Verify that pdf function was called
      expect(mockPdf).toHaveBeenCalledTimes(1);
      expect(mockPdf).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle empty data array', async () => {
      const result = await pdfService.generateDossierPDF([], mockImages);

      expect(result).toBeInstanceOf(Blob);
      expect(mockPdf).toHaveBeenCalledTimes(1);
    });

    it('should handle empty images map', async () => {
      const emptyImages = new Map<string, string>();
      const result = await pdfService.generateDossierPDF(mockPersonData, emptyImages);

      expect(result).toBeInstanceOf(Blob);
      expect(mockPdf).toHaveBeenCalledTimes(1);
    });

    it('should throw error when PDF generation fails', async () => {
      const error = new Error('PDF generation failed');
      mockToBlob.mockRejectedValue(error);

      await expect(pdfService.generateDossierPDF(mockPersonData, mockImages))
        .rejects.toThrow('Dossier PDF generation failed: PDF generation failed');
    });

    it('should handle unknown errors', async () => {
      mockToBlob.mockRejectedValue('Unknown error');

      await expect(pdfService.generateDossierPDF(mockPersonData, mockImages))
        .rejects.toThrow('Dossier PDF generation failed: Unknown error');
    });

    it('should handle large datasets', async () => {
      // Create a large dataset
      const largeDataset: PersonData[] = Array.from({ length: 100 }, (_, i) => ({
        person: `Person ${i + 1}`,
        word: `Word${i + 1}`,
        description: `Description for person ${i + 1}`,
        picture: `person${i + 1}.jpg`
      }));

      const result = await pdfService.generateDossierPDF(largeDataset, mockImages);

      expect(result).toBeInstanceOf(Blob);
      expect(mockPdf).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in data', async () => {
      const specialCharData: PersonData[] = [
        {
          person: 'José María',
          word: 'Innovación',
          description: 'A person with special characters: áéíóú, ñ, ç, and symbols like @#$%',
          picture: 'jose.jpg'
        }
      ];

      const result = await pdfService.generateDossierPDF(specialCharData, mockImages);

      expect(result).toBeInstanceOf(Blob);
      expect(mockPdf).toHaveBeenCalledTimes(1);
    });

    it('should handle very long descriptions', async () => {
      const longDescriptionData: PersonData[] = [
        {
          person: 'John Doe',
          word: 'Innovation',
          description: 'A'.repeat(1000), // Very long description
          picture: 'john.jpg'
        }
      ];

      const result = await pdfService.generateDossierPDF(longDescriptionData, mockImages);

      expect(result).toBeInstanceOf(Blob);
      expect(mockPdf).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      mockToBlob.mockRejectedValue(error);

      await expect(pdfService.generateDossierPDF(mockPersonData, mockImages))
        .rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate Dossier PDF:', error);
      
      consoleSpy.mockRestore();
    });
  });
});