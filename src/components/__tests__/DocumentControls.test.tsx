import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentControls } from '../DocumentControls';
import type { PersonData, WordCloudConfig } from '../../types';

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

  const mockOnGenerateWordCloud = vi.fn();
  const mockOnGenerateDossier = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render document controls with data', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      expect(screen.getByText('Document Generation')).toBeInTheDocument();
      expect(screen.getByText('Ready to generate documents from 2 items')).toBeInTheDocument();
      expect(screen.getByText('Word Cloud PDF')).toBeInTheDocument();
      expect(screen.getByText('Dossier PDF')).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(
        <DocumentControls
          data={[]}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      expect(screen.getByText('Load data to enable document generation')).toBeInTheDocument();
    });

    it('should show loading state when generating', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
          isGenerating={true}
        />
      );

      expect(screen.getByText('Generating Word Cloud PDF...')).toBeInTheDocument();
      expect(screen.getByText('Generating Dossier PDF...')).toBeInTheDocument();
    });

    it('should disable controls when disabled prop is true', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
          disabled={true}
        />
      );

      const wordCloudButton = screen.getByText('Generate Word Cloud PDF');
      const dossierButton = screen.getByText('Generate Dossier PDF');

      expect(wordCloudButton).toBeDisabled();
      expect(dossierButton).toBeDisabled();
    });
  });

  describe('Paper Size Selection', () => {
    it('should default to A4 paper size', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      const a4Button = screen.getByText('A4 (8.3" × 11.7")');
      expect(a4Button).toHaveClass('bg-blue-600');
    });

    it('should allow switching to A3 paper size', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      const a3Button = screen.getByText('A3 (11.7" × 16.5")');
      fireEvent.click(a3Button);

      expect(a3Button).toHaveClass('bg-blue-600');
      expect(screen.getByText(/Selected: A3/)).toBeInTheDocument();
    });

    it('should update configuration summary when paper size changes', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      // Default should show A4 landscape - use a function matcher for broken up text
      expect(screen.getByText((content, element) => {
        return element?.textContent?.includes('Selected:') && 
               element?.textContent?.includes('A4') && 
               element?.textContent?.includes('landscape') || false;
      })).toBeInTheDocument();

      // Switch to A3
      const a3Button = screen.getByText('A3 (11.7" × 16.5")');
      fireEvent.click(a3Button);

      expect(screen.getByText((content, element) => {
        return element?.textContent?.includes('Selected:') && 
               element?.textContent?.includes('A3') && 
               element?.textContent?.includes('landscape') || false;
      })).toBeInTheDocument();
    });
  });

  describe('Orientation Selection', () => {
    it('should default to landscape orientation', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      const landscapeButton = screen.getByText('Landscape');
      expect(landscapeButton).toHaveClass('bg-blue-600');
    });

    it('should allow switching to portrait orientation', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      const portraitButton = screen.getByText('Portrait');
      fireEvent.click(portraitButton);

      expect(portraitButton).toHaveClass('bg-blue-600');
      expect(screen.getByText(/Selected: A4 portrait/)).toBeInTheDocument();
    });

    it('should show correct dimensions for different orientations', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      // Default landscape - check for dimensions
      expect(screen.getByText((content, element) => {
        return element?.textContent?.includes('(11.7" × 8.3")') || false;
      })).toBeInTheDocument();

      // Switch to portrait
      const portraitButton = screen.getByText('Portrait');
      fireEvent.click(portraitButton);

      expect(screen.getByText((content, element) => {
        return element?.textContent?.includes('(8.3" × 11.7")') || false;
      })).toBeInTheDocument();
    });
  });

  describe('Word Cloud Generation', () => {
    it('should call onGenerateWordCloud with correct config', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      const generateButton = screen.getByText('Generate Word Cloud PDF');
      fireEvent.click(generateButton);

      expect(mockOnGenerateWordCloud).toHaveBeenCalledWith({
        paperSize: 'A4',
        orientation: 'landscape',
      });
    });

    it('should call onGenerateWordCloud with updated config', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      // Change to A3 portrait
      const a3Button = screen.getByText('A3 (11.7" × 16.5")');
      const portraitButton = screen.getByText('Portrait');
      fireEvent.click(a3Button);
      fireEvent.click(portraitButton);

      const generateButton = screen.getByText('Generate Word Cloud PDF');
      fireEvent.click(generateButton);

      expect(mockOnGenerateWordCloud).toHaveBeenCalledWith({
        paperSize: 'A3',
        orientation: 'portrait',
      });
    });

    it('should not call onGenerateWordCloud when disabled', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
          disabled={true}
        />
      );

      const generateButton = screen.getByText('Generate Word Cloud PDF');
      fireEvent.click(generateButton);

      expect(mockOnGenerateWordCloud).not.toHaveBeenCalled();
    });

    it('should not call onGenerateWordCloud when no data', () => {
      render(
        <DocumentControls
          data={[]}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      const generateButton = screen.getByText('Generate Word Cloud PDF');
      fireEvent.click(generateButton);

      expect(mockOnGenerateWordCloud).not.toHaveBeenCalled();
    });

    it('should not call onGenerateWordCloud when generating', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
          isGenerating={true}
        />
      );

      const generateButton = screen.getByText('Generating Word Cloud PDF...');
      fireEvent.click(generateButton);

      expect(mockOnGenerateWordCloud).not.toHaveBeenCalled();
    });
  });

  describe('Dossier Generation', () => {
    it('should call onGenerateDossier when button clicked', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      const generateButton = screen.getByText('Generate Dossier PDF');
      fireEvent.click(generateButton);

      expect(mockOnGenerateDossier).toHaveBeenCalled();
    });

    it('should not call onGenerateDossier when disabled', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
          disabled={true}
        />
      );

      const generateButton = screen.getByText('Generate Dossier PDF');
      fireEvent.click(generateButton);

      expect(mockOnGenerateDossier).not.toHaveBeenCalled();
    });

    it('should show dossier configuration info', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      expect(screen.getByText((content, element) => {
        return element?.textContent?.includes('Format:') && 
               element?.textContent?.includes('A4 Portrait') || false;
      })).toBeInTheDocument();
      
      expect(screen.getByText((content, element) => {
        return element?.textContent?.includes('Content:') && 
               element?.textContent?.includes('Person, word, description, and images') || false;
      })).toBeInTheDocument();
    });
  });

  describe('Data Summary', () => {
    it('should show data summary when data is available', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      expect(screen.getByText('Data Summary')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total items
      expect(screen.getByText('2')).toBeInTheDocument(); // Unique words (both words are different)
    });

    it('should calculate unique words correctly', () => {
      const dataWithDuplicateWords: PersonData[] = [
        {
          person: 'John Doe',
          word: 'Innovation',
          description: 'A creative thinker',
          picture: 'john.jpg',
        },
        {
          person: 'Jane Smith',
          word: 'innovation', // Same word, different case
          description: 'A natural leader',
          picture: 'jane.jpg',
        },
        {
          person: 'Bob Johnson',
          word: 'Leadership',
          description: 'A team player',
          picture: 'bob.jpg',
        },
      ];

      render(
        <DocumentControls
          data={dataWithDuplicateWords}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      // Should show 3 total items and 2 unique words (innovation counted once)
      const totalItems = screen.getAllByText('3');
      const uniqueWords = screen.getAllByText('2');
      
      expect(totalItems.length).toBeGreaterThan(0);
      expect(uniqueWords.length).toBeGreaterThan(0);
    });

    it('should not show data summary when no data', () => {
      render(
        <DocumentControls
          data={[]}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      expect(screen.queryByText('Data Summary')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      expect(screen.getByRole('button', { name: /Generate Word Cloud PDF/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate Dossier PDF/ })).toBeInTheDocument();
    });

    it('should have proper form labels', () => {
      render(
        <DocumentControls
          data={mockData}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      expect(screen.getByText('Paper Size')).toBeInTheDocument();
      expect(screen.getByText('Orientation')).toBeInTheDocument();
    });

    it('should indicate disabled state properly', () => {
      render(
        <DocumentControls
          data={[]}
          onGenerateWordCloud={mockOnGenerateWordCloud}
          onGenerateDossier={mockOnGenerateDossier}
        />
      );

      const wordCloudButton = screen.getByText('Generate Word Cloud PDF');
      const dossierButton = screen.getByText('Generate Dossier PDF');

      expect(wordCloudButton).toHaveAttribute('disabled');
      expect(dossierButton).toHaveAttribute('disabled');
    });
  });
});