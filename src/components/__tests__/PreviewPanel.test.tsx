import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PreviewPanel } from '../PreviewPanel';
import type { PersonData, WordCloudConfig, GoogleFont } from '../../types';

// Mock the child components
vi.mock('../DossierPreview', () => ({
  DossierPreview: ({ data, isGenerating, onPreviewReady }: any) => {
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
  WordCloudGenerator: ({ data, config, isGenerating, onPreviewReady, onWordsGenerated }: any) => {
    setTimeout(() => {
      onWordsGenerated?.([]);
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
    ['john.jpg', 'data:image/jpeg;base64,mockdata1'],
    ['jane.jpg', 'data:image/jpeg;base64,mockdata2'],
  ]);

  const mockFonts: GoogleFont[] = [
    { family: 'Inter', weights: [400, 600, 700] },
    { family: 'Roboto', weights: [300, 400, 500] },
  ];

  const mockWordCloudConfig: WordCloudConfig = {
    paperSize: 'A4',
    orientation: 'landscape',
    colorScheme: 'color',
    dpi: 300
  };

  const mockOnWordsGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render empty state when no data', () => {
      render(
        <PreviewPanel
          data={[]}
          images={new Map()}
          currentView="none"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
        />
      );

      expect(screen.getByText('No Data Loaded')).toBeInTheDocument();
      expect(screen.getByText('Load your JSON data and images to get started with document generation.')).toBeInTheDocument();
    });

    it('should render data summary when data is loaded', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="none"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
        />
      );

      expect(screen.getByText('Data Summary')).toBeInTheDocument();
      expect(screen.getByText('2 people loaded')).toBeInTheDocument();
      expect(screen.getByText('2 unique words')).toBeInTheDocument();
    });

    it('should render word cloud when currentView is wordcloud', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
        />
      );

      expect(screen.getByTestId('wordcloud-generator')).toBeInTheDocument();
      expect(screen.getByText('Word Cloud - 2 words - A4 landscape')).toBeInTheDocument();
    });

    it('should render dossier when currentView is dossier', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="dossier"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
        />
      );

      expect(screen.getByTestId('dossier-preview')).toBeInTheDocument();
      expect(screen.getByText('Dossier Preview - 2 items')).toBeInTheDocument();
    });

    it('should show generating state for word cloud', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          isGenerating={true}
          onWordsGenerated={mockOnWordsGenerated}
        />
      );

      expect(screen.getByTestId('wordcloud-generating')).toBeInTheDocument();
    });

    it('should show generating state for dossier', () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="dossier"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          isGenerating={true}
          onWordsGenerated={mockOnWordsGenerated}
        />
      );

      expect(screen.getByTestId('dossier-generating')).toBeInTheDocument();
    });
  });

  describe('Configuration Updates', () => {
    it('should handle configuration changes', async () => {
      const { rerender } = render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
        />
      );

      const newConfig: WordCloudConfig = {
        paperSize: 'A3',
        orientation: 'portrait',
        colorScheme: 'color',
        dpi: 300
      };

      rerender(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={newConfig}
          fonts={mockFonts}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
        />
      );

      expect(screen.getByText('Word Cloud - 2 words - A3 portrait')).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onWordsGenerated when words are generated', async () => {
      render(
        <PreviewPanel
          data={mockData}
          images={mockImages}
          currentView="wordcloud"
          wordCloudConfig={mockWordCloudConfig}
          fonts={mockFonts}
          isGenerating={false}
          onWordsGenerated={mockOnWordsGenerated}
        />
      );

      await waitFor(() => {
        expect(mockOnWordsGenerated).toHaveBeenCalled();
      });
    });
  });
});