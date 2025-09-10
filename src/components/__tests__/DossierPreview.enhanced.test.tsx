import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DossierPreview } from '../DossierPreview';
import type { PersonData } from '../../types';

describe('DossierPreview - Enhanced Features', () => {
  const mockData: PersonData[] = [
    {
      person: 'John Doe',
      word: 'Innovation',
      description: 'A creative thinker who brings innovative solutions to complex problems.',
      picture: 'john.jpg',
    },
    {
      person: 'Jane Smith',
      word: 'Leadership',
      description: 'A natural leader who inspires teams to achieve their best.',
      picture: 'jane.jpg',
    },
    {
      person: 'Bob Johnson',
      word: 'Collaboration',
      description: 'Excellent at working with diverse teams and building consensus.',
      picture: 'bob.jpg',
    },
  ];

  const mockImages = new Map([
    ['john.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'],
    ['jane.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD']
    // Note: bob.jpg is intentionally missing to test missing image handling
  ]);

  const mockOnPreviewReady = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visual Feedback', () => {
    it('should show loading state initially', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    });

    it('should show generating state when PDF is being generated', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={true}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('Generating PDF...')).toBeInTheDocument();
    });

    it('should show ready state when preview is complete', async () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Preview ready')).toBeInTheDocument();
      });
    });

    it('should show print accuracy indicator', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText(/Print-accurate preview at 1:4 scale/)).toBeInTheDocument();
      expect(screen.getByText(/Actual size: 8.3" × 11.7"/)).toBeInTheDocument();
    });
  });

  describe('Image Loading Feedback', () => {
    it('should handle successful image loading', async () => {
      render(
        <DossierPreview
          data={mockData.slice(0, 2)} // Only John and Jane (both have images)
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Find images and simulate load events
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);

      // Simulate image load events
      fireEvent.load(images[0]);
      fireEvent.load(images[1]);

      await waitFor(() => {
        expect(mockOnPreviewReady).toHaveBeenCalled();
      });
    });

    it('should handle missing images gracefully', () => {
      render(
        <DossierPreview
          data={[mockData[2]]} // Bob Johnson - no image available
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Should show placeholder for missing image
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      // Should show SVG placeholder icon
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should handle image load errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <DossierPreview
          data={[mockData[0]]} // John Doe
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      const image = screen.getByRole('img');
      fireEvent.error(image);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load image for John Doe');
        expect(mockOnPreviewReady).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should call onPreviewReady when no images are present', async () => {
      const dataWithoutImages = mockData.map(item => ({ ...item, picture: '' }));

      render(
        <DossierPreview
          data={dataWithoutImages}
          images={new Map()}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      await waitFor(() => {
        expect(mockOnPreviewReady).toHaveBeenCalled();
      });
    });
  });

  describe('Print Accuracy', () => {
    it('should maintain A4 aspect ratio', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Check for A4 aspect ratio container
      const pageContainers = screen.getAllByText(/Page \d+ of \d+/);
      expect(pageContainers.length).toBeGreaterThan(0);
    });

    it('should show correct page count for data', () => {
      render(
        <DossierPreview
          data={mockData} // 3 items = 2 pages (2 items per page)
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('Preview of 3 entries across 2 pages (A4 Portrait)')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    it('should handle single page correctly', () => {
      render(
        <DossierPreview
          data={mockData.slice(0, 2)} // 2 items = 1 page
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('Preview of 2 entries across 1 page (A4 Portrait)')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });

    it('should show generation date in footer', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      const today = new Date().toLocaleDateString();
      expect(screen.getByText(`Generated on ${today}`)).toBeInTheDocument();
    });
  });

  describe('Content Accuracy', () => {
    it('should display all person data correctly', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Check all persons are displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

      // Check all words are displayed
      expect(screen.getByText('Innovation')).toBeInTheDocument();
      expect(screen.getByText('Leadership')).toBeInTheDocument();
      expect(screen.getByText('Collaboration')).toBeInTheDocument();

      // Check descriptions are displayed
      expect(screen.getByText(/A creative thinker who brings innovative solutions/)).toBeInTheDocument();
      expect(screen.getByText(/A natural leader who inspires teams/)).toBeInTheDocument();
      expect(screen.getByText(/Excellent at working with diverse teams/)).toBeInTheDocument();
    });

    it('should maintain consistent formatting across pages', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Check headers are consistent
      const headers = screen.getAllByText('Dossier');
      expect(headers.length).toBe(2); // One per page

      // Check word labels are consistent
      const wordLabels = screen.getAllByText('Word:');
      expect(wordLabels.length).toBe(3); // One per person

      // Check description labels are consistent
      const descriptionLabels = screen.getAllByText('Description:');
      expect(descriptionLabels.length).toBe(3); // One per person
    });
  });

  describe('Responsiveness', () => {
    it('should handle rapid data changes', async () => {
      const { rerender } = render(
        <DossierPreview
          data={mockData.slice(0, 1)}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('Preview of 1 entries across 1 page')).toBeInTheDocument();

      // Rapidly change data
      rerender(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Preview of 3 entries across 2 pages')).toBeInTheDocument();
      });
    });

    it('should handle empty data gracefully', () => {
      render(
        <DossierPreview
          data={[]}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('No data to preview. Please load data first.')).toBeInTheDocument();
    });

    it('should apply opacity during loading', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Check that preview content has opacity class during loading
      const previewContainer = screen.getByText('Preview of 3 entries across 2 pages').closest('div');
      expect(previewContainer?.nextElementSibling).toHaveClass('opacity-50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      render(
        <DossierPreview
          data={mockData.slice(0, 2)}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByAltText('Picture of John Doe')).toBeInTheDocument();
      expect(screen.getByAltText('Picture of Jane Smith')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={false}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByRole('heading', { level: 2, name: 'Dossier Preview' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'John Doe' })).toBeInTheDocument();
    });

    it('should provide meaningful status updates', () => {
      render(
        <DossierPreview
          data={mockData}
          images={mockImages}
          isGenerating={true}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('Generating PDF...')).toBeInTheDocument();
    });
  });
});