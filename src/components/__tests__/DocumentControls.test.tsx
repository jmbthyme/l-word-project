import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentControls } from '../DocumentControls';
import type { PersonData } from '../../types';

describe('DocumentControls', () => {
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

  const mockOnGenerateWordCloudPreview = vi.fn();
  const mockOnGenerateDossierPreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render document controls with data', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          currentView="none"
        />
      );

      expect(screen.getByText('Generate Content')).toBeInTheDocument();
      expect(screen.getByText('Ready to create image and document from 2 items')).toBeInTheDocument();
      expect(screen.getByText('Word Cloud Image')).toBeInTheDocument();
      expect(screen.getByText('Dossier Document')).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(
        <DocumentControls
          data={[]}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          currentView="none"
        />
      );

      expect(screen.getByText('Load data to enable document creation')).toBeInTheDocument();
    });

    it('should show generating state', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          currentView="none"
          isGeneratingPreview={true}
        />
      );

      expect(screen.getByText('Generating Preview...')).toBeInTheDocument();
    });

    it('should disable controls when disabled prop is true', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          currentView="none"
          disabled={true}
        />
      );

      const wordCloudButton = screen.getByText('Create Word Cloud Preview');
      const dossierButton = screen.getByText('Create Dossier Preview');
      
      expect(wordCloudButton).toBeDisabled();
      expect(dossierButton).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('should call onGenerateWordCloudPreview when word cloud button is clicked', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          currentView="none"
        />
      );

      const button = screen.getByText('Create Word Cloud Preview');
      fireEvent.click(button);

      expect(mockOnGenerateWordCloudPreview).toHaveBeenCalledWith({
        paperSize: 'A4',
        orientation: 'landscape',
        colorScheme: 'color',
        dpi: 300,
        padding: 0
      });
    });

    it('should call onGenerateDossierPreview when dossier button is clicked', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          currentView="none"
        />
      );

      const button = screen.getByText('Create Dossier Preview');
      fireEvent.click(button);

      expect(mockOnGenerateDossierPreview).toHaveBeenCalled();
    });

    it('should show download button when currentView is wordcloud', () => {
      const mockOnDownloadWordCloudPDF = vi.fn();
      
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          onDownloadWordCloudPDF={mockOnDownloadWordCloudPDF}
          currentView="wordcloud"
        />
      );

      expect(screen.getByText('Download Word Cloud Image')).toBeInTheDocument();
    });

    it('should show download button when currentView is dossier', () => {
      const mockOnDownloadDossierPDF = vi.fn();
      
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          onDownloadDossierPDF={mockOnDownloadDossierPDF}
          currentView="dossier"
        />
      );

      expect(screen.getByText('Download Dossier PDF')).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should allow changing paper size', () => {
      const mockOnConfigChange = vi.fn();
      
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          onConfigChange={mockOnConfigChange}
          currentView="none"
        />
      );

      const a3Button = screen.getByText('A3 (11.7" × 16.5")');
      fireEvent.click(a3Button);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        paperSize: 'A3',
        orientation: 'landscape',
        colorScheme: 'color',
        dpi: 300,
        padding: 0
      });
    });

    it('should allow changing orientation', () => {
      const mockOnConfigChange = vi.fn();
      
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloudPreview={mockOnGenerateWordCloudPreview}
          onGenerateDossierPreview={mockOnGenerateDossierPreview}
          onConfigChange={mockOnConfigChange}
          currentView="none"
        />
      );

      const portraitButton = screen.getByText('Portrait');
      fireEvent.click(portraitButton);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        paperSize: 'A4',
        orientation: 'portrait',
        colorScheme: 'color',
        dpi: 300,
        padding: 0
      });
    });
  });
});