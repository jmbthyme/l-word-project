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

    it('should reject empty data array', async () => {
      await expect(pdfService.generateDossierPDF([], mockImages))
        .rejects.toThrow('Data array cannot be empty');
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

    it('should handle large datasets with warning', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
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
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Large dataset detected')
      );
      
      consoleSpy.mockRestore();
    });

    it('should reject datasets that are too large', async () => {
      // Create an extremely large dataset
      const extremelyLargeDataset: PersonData[] = Array.from({ length: 1001 }, (_, i) => ({
        person: `Person ${i + 1}`,
        word: `Word${i + 1}`,
        description: `Description for person ${i + 1}`,
        picture: `person${i + 1}.jpg`
      }));

      await expect(pdfService.generateDossierPDF(extremelyLargeDataset, mockImages))
        .rejects.toThrow('Dataset too large. Maximum 1000 items supported for PDF generation.');
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

  describe('data validation', () => {
    it('should reject non-array data', async () => {
      await expect(pdfService.generateDossierPDF({} as any, mockImages))
        .rejects.toThrow('Data must be an array');
    });

    it('should reject empty data array', async () => {
      await expect(pdfService.generateDossierPDF([], mockImages))
        .rejects.toThrow('Data array cannot be empty');
    });

    it('should validate person data fields', async () => {
      const invalidData = [
        {
          person: '',
          word: 'Innovation',
          description: 'Description',
          picture: 'image.jpg'
        }
      ];

      await expect(pdfService.generateDossierPDF(invalidData, mockImages))
        .rejects.toThrow('Invalid person name at index 0');
    });

    it('should validate word fields', async () => {
      const invalidData = [
        {
          person: 'John Doe',
          word: '',
          description: 'Description',
          picture: 'image.jpg'
        }
      ];

      await expect(pdfService.generateDossierPDF(invalidData, mockImages))
        .rejects.toThrow('Invalid word at index 0');
    });

    it('should validate description fields', async () => {
      const invalidData = [
        {
          person: 'John Doe',
          word: 'Innovation',
          description: '',
          picture: 'image.jpg'
        }
      ];

      await expect(pdfService.generateDossierPDF(invalidData, mockImages))
        .rejects.toThrow('Invalid description at index 0');
    });

    it('should validate picture fields', async () => {
      const invalidData = [
        {
          person: 'John Doe',
          word: 'Innovation',
          description: 'Description',
          picture: ''
        }
      ];

      await expect(pdfService.generateDossierPDF(invalidData, mockImages))
        .rejects.toThrow('Invalid picture filename at index 0');
    });
  });

  describe('image optimization', () => {
    it('should handle large images with warning', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create a large base64 image (simulate 1MB image)
      const largeImageData = 'data:image/jpeg;base64,' + 'A'.repeat(1400000);
      const largeImages = new Map([['large.jpg', largeImageData]]);

      const result = await pdfService.generateDossierPDF(mockPersonData, largeImages);

      expect(result).toBeInstanceOf(Blob);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Large image detected')
      );
      
      consoleSpy.mockRestore();
    });

    it('should skip problematic images gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create images map with invalid data
      const problematicImages = new Map([
        ['valid.jpg', 'data:image/jpeg;base64,validdata'],
        ['invalid.jpg', null as any] // This will cause processing to fail
      ]);

      const result = await pdfService.generateDossierPDF(mockPersonData, problematicImages);

      expect(result).toBeInstanceOf(Blob);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to process image invalid.jpg:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
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

    it('should provide specific error messages for memory issues', async () => {
      const memoryError = new Error('memory allocation failed');
      mockToBlob.mockRejectedValue(memoryError);

      await expect(pdfService.generateDossierPDF(mockPersonData, mockImages))
        .rejects.toThrow('Dossier PDF generation failed due to memory constraints');
    });

    it('should provide specific error messages for timeout issues', async () => {
      const timeoutError = new Error('timeout exceeded');
      mockToBlob.mockRejectedValue(timeoutError);

      await expect(pdfService.generateDossierPDF(mockPersonData, mockImages))
        .rejects.toThrow('Dossier PDF generation timed out');
    });

    it('should handle empty blob generation', async () => {
      mockToBlob.mockResolvedValue(new Blob([], { type: 'application/pdf' }));

      await expect(pdfService.generateDossierPDF(mockPersonData, mockImages))
        .rejects.toThrow('Generated PDF is empty or invalid');
    });

    it('should retry PDF generation on failure', async () => {
      // First attempt fails, second succeeds
      mockToBlob
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(new Blob(['mock pdf content'], { type: 'application/pdf' }));

      const result = await pdfService.generateDossierPDF(mockPersonData, mockImages);

      expect(result).toBeInstanceOf(Blob);
      expect(mockToBlob).toHaveBeenCalledTimes(2);
    });
  });
});