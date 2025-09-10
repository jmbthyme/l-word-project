import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFService } from '../PDFService';
import type { PersonData } from '../../types';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => {
  const mockPdf = vi.fn();
  // const mockToBlob = vi.fn();
  
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

describe('PDFService - Integration Tests', () => {
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

  describe('Complete Dossier PDF Generation Workflow', () => {
    it('should successfully generate a dossier PDF with all optimizations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Test with a moderately sized dataset
      const testData: PersonData[] = Array.from({ length: 10 }, (_, i) => ({
        person: `Person ${i + 1}`,
        word: `Word${i + 1}`,
        description: `This is a detailed description for person ${i + 1}. It contains enough text to test the layout and pagination features.`,
        picture: `person${i + 1}.jpg`
      }));

      const result = await pdfService.generateDossierPDF(testData, mockImages);

      // Verify successful generation
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
      expect(result.size).toBeGreaterThan(0);

      // Verify PDF generation was called
      expect(mockPdf).toHaveBeenCalledTimes(1);
      expect(mockToBlob).toHaveBeenCalledTimes(1);

      // Verify the PDF generation process completed successfully
      // The actual component interaction is tested in the component tests

      consoleSpy.mockRestore();
    });

    it('should handle the complete workflow with missing images', async () => {
      const partialImages = new Map([
        ['person1.jpg', mockImages.get('john_doe.jpg')!]
        // Missing images for other people
      ]);

      const result = await pdfService.generateDossierPDF(mockPersonData, partialImages);

      expect(result).toBeInstanceOf(Blob);
      expect(mockPdf).toHaveBeenCalledTimes(1);
    });

    it('should optimize items per page based on description length', async () => {
      // Test with very long descriptions
      const longDescriptionData: PersonData[] = [
        {
          person: 'John Doe',
          word: 'Innovation',
          description: 'A'.repeat(600), // Very long description
          picture: 'john_doe.jpg'
        },
        {
          person: 'Jane Smith',
          word: 'Leadership',
          description: 'B'.repeat(600), // Very long description
          picture: 'jane_smith.jpg'
        }
      ];

      const result = await pdfService.generateDossierPDF(longDescriptionData, mockImages);

      expect(result).toBeInstanceOf(Blob);
      
      // Verify the PDF was generated successfully with optimized configuration
      // The actual optimization logic is tested in the unit tests
    });

    it('should handle PDF download functionality', () => {
      const mockBlob = new Blob(['test pdf content'], { type: 'application/pdf' });
      const filename = 'test-dossier.pdf';

      // Mock DOM methods
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };

      const mockCreateElement = vi.fn().mockReturnValue(mockLink);
      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true
      });

      // Test download functionality
      pdfService.downloadPDF(mockBlob, filename);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe(filename);
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});