import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PreviewPanel } from '../PreviewPanel';
import type { PersonData, WordCloudConfig, GoogleFont, WordCloudItem } from '../../types';

// Mock the child components
vi.mock('../DossierPreview', () => ({
  DossierPreview: ({ data, images, isGenerating, onPreviewReady }: any) => {
    // Simulate preview ready callback
    setTimeout(() => onPreviewReady?.(), 100);
    return (
      <div data-testid="dossier-preview">
        Dossier Preview - {data.length} items
        {isGenerating && <span data-testid="dossier-generating">Generating...</span>}
      </div>
    );
  }
}));

vi.mock('../WordCloudGenerator', () => ({
  WordCloudGenerator: ({ data, config, fonts, isGenerating, onPreviewReady, onWordsGenerated }: any) => {
    // Simulate words generation and preview ready
    setTimeout(() => {
      const mockWords: WordCloudItem[] = data.map((item: PersonData, index: number) => ({
        text: item.word,
        size: 24 + index * 4,
        weight: 400,
        fontFamily: 'Arial',
        color: '#333',
        x: 100 + index * 50,
        y: 100 + index * 30
      }));
      onWordsGenerated?.(mockWords);
      onPreviewReady?.();
    }, 100);

    return (
      <div data-testid="wordcloud-generator">
        Word Cloud - {data.length} words - {config.paperSize} {config.orientation}
        {isGenerating && <span data-testid="wordcloud-generating">Generating...</span>}
      </div>
    );
  }
}));

describe('PreviewPanel', () => {
  const mockData: PersonData[] = [
    {
      person: 'John Doe',
      word: 'Innovation',
      description: 'A creative thinker',
      picture: 'john.jpg',
    },
    {
      person: 'Jane Smith',
      word: 'Leadership',
      description: 'A natural leader',
      picture: 'jane.jpg',
    },
  ];

  const mockImages = new Map([
    ['john.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'],
    ['jane.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD']
  ]);

  const mockFonts: GoogleFont[] = [
    { family: 'Roboto', weights: [400, 700] },
    { family: 'Open Sans', weights: [400, 600] }
  ];

  const mockWordCloudConfig: WordCloudConfig = {
    paperSize: 'A4',
    orientation: 'landscape'
  };

  const mockWordCloudItems: WordCloudItem[] = [
    {
      text: 'Innovation',
      size: 24,
      weight: 400,
      fontFamily: 'Roboto',
      color: '#333',
      x: 100,
      y: 100
    }
  ];

  const mockOnWordsGenerated = vi.fn();
  const mockOnConfigChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should render empty state when no data', () => {
      render(
        <PreviewPanel
          data={[]}
          images={new Map()}
          currentView="none"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={[]}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByText('No Data Loaded')).toBeInTheDocument();
      expect(screen.getByText('Load your JSON data and images to get started with document generation.')).toBeInTheDocument();
    });
  });

  describe('Ready State', () => {
    it('should render ready state when data loaded but no view selected', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="none"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByText('Data Ready')).toBeInTheDocument();
      expect(screen.getByText('2 items loaded. Choose a document type to generate.')).toBeInTheDocument();
      expect(screen.getByText('Word Cloud: Visual representation of words')).toBeInTheDocument();
      expect(screen.getByText('Dossier: Comprehensive document with all data')).toBeInTheDocument();
    });
  });

  describe('Word Cloud Preview', () => {
    it('should render word cloud preview', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByText('Word Cloud Preview')).toBeInTheDocument();
      expect(screen.getByText('Interactive preview with 2 words')).toBeInTheDocument();
      expect(screen.getByTestId('wordcloud-generator')).toBeInTheDocument();
      expect(screen.getByText(/Print-accurate preview/)).toBeInTheDocument();
    });

    it('should show configuration in preview', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByText(/11.7" × 8.3"/)).toBeInTheDocument(); // A4 landscape dimensions
    });

    it('should show updating indicator when configuration changes', async () => {
      const { rerender } = render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      // Change configuration
      const newConfig: WordCloudConfig = {
        paperSize: 'A3',
        orientation: 'portrait'
      };

      rerender(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={newConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByText('Updating preview...')).toBeInTheDocument();
    });

    it('should show generating state', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={true}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByTestId('wordcloud-generating')).toBeInTheDocument();
    });

    it('should show ready indicator when preview is ready', async () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });

    it('should handle different paper sizes and orientations', () => {
      const configs = [
        { paperSize: 'A4' as const, orientation: 'portrait' as const, expected: '8.3" × 11.7"' },
        { paperSize: 'A4' as const, orientation: 'landscape' as const, expected: '11.7" × 8.3"' },
        { paperSize: 'A3' as const, orientation: 'portrait' as const, expected: '11.7" × 16.5"' },
        { paperSize: 'A3' as const, orientation: 'landscape' as const, expected: '16.5" × 11.7"' },
      ];

      configs.forEach(({ paperSize, orientation, expected }) => {
        const { unmount } = render(
          <PreviewPanel
            data={mockData}
            images={mockImages}
            currentView="wordcloud"
            wordCloudConfig={{ paperSize, orientation }}
            fonts={mockFonts}
            wordCloudItems={mockWordCloudItems}
            isGenerating={false}
            onWordsGenerated={mockOnWordsGenerated}
            onConfigChange={mockOnConfigChange}
          />
        );

        expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Dossier Preview', () => {
    it('should render dossier preview', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="dossier"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByTestId('dossier-preview')).toBeInTheDocument();
      expect(screen.getByText('Dossier Preview - 2 items')).toBeInTheDocument();
    });

    it('should show generating state for dossier', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="dossier"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={true}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByTestId('dossier-generating')).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onWordsGenerated when word cloud generates words', async () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(mockOnWordsGenerated).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              text: 'Innovation',
              size: expect.any(Number),
              weight: expect.any(Number),
              fontFamily: expect.any(String)
            })
          ])
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByRole('heading', { level: 3, name: 'Word Cloud Preview' })).toBeInTheDocument();
    });

    it('should provide meaningful status messages', () => {
      render(
        <PreviewPanel
          data={[]}
          images={new Map()}
          currentView="none"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={[]}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByText('Load your JSON data and images to get started with document generation.')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        person: `Person ${i}`,
        word: `Word${i}`,
        description: `Description for person ${i}`,
        picture: `person${i}.jpg`
      }));

      const startTime = performance.now();
      
      render(
        <PreviewPanel
          data={largeData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          wordCloudItems={mockWordCloudItems}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
          onConfigChange={mockOnConfigChange}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText('Interactive preview with 100 words')).toBeInTheDocument();
    });
  });
});