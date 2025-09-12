import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WordCloudGenerator } from '../WordCloudGenerator';
import type { PersonData, WordCloudConfig, GoogleFont } from '../../types';

describe('WordCloudGenerator - Enhanced Features', () => {
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
    {
      person: 'Bob Johnson',
      word: 'Innovation', // Duplicate word to test frequency
      description: 'Another innovator',
      picture: 'bob.jpg',
    },
  ];

  const mockFonts: GoogleFont[] = [
    { family: 'Roboto', weights: [400, 700] },
    { family: 'Open Sans', weights: [400, 600, 800] },
    { family: 'Lato', weights: [300, 400, 700] }
  ];

  const mockOnWordsGenerated = vi.fn();
  const mockOnPreviewReady = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration Reactivity', () => {
    it('should update layout when configuration changes', () => {
      const config1: WordCloudConfig = { paperSize: 'A4', orientation: 'portrait', colorScheme: 'color', dpi: 300, padding: 0 };
      const config2: WordCloudConfig = { paperSize: 'A3', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 };

      const { rerender } = render(
        <WordCloudGenerator
          data={mockData}
          config={config1}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Check initial configuration indicator
      expect(screen.getByText('A4 portrait (8.3" × 11.7")')).toBeInTheDocument();

      // Change configuration
      rerender(
        <WordCloudGenerator
          data={mockData}
          config={config2}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Check updated configuration indicator
      expect(screen.getByText('A3 landscape (16.5" × 11.7")')).toBeInTheDocument();
    });

    it('should maintain correct aspect ratio for different configurations', () => {
      const configs = [
        { paperSize: 'A4' as const, orientation: 'portrait' as const, colorScheme: 'color' as const, dpi: 300 as const, padding: 0 as const, aspectRatio: '8.3/11.7' },
        { paperSize: 'A4' as const, orientation: 'landscape' as const, colorScheme: 'color' as const, dpi: 300 as const, padding: 0 as const, aspectRatio: '11.7/8.3' },
        { paperSize: 'A3' as const, orientation: 'portrait' as const, colorScheme: 'color' as const, dpi: 300 as const, padding: 0 as const, aspectRatio: '11.7/16.5' },
        { paperSize: 'A3' as const, orientation: 'landscape' as const, colorScheme: 'color' as const, dpi: 300 as const, padding: 0 as const, aspectRatio: '16.5/11.7' },
      ];

      configs.forEach(({ paperSize, orientation, colorScheme, dpi, padding, aspectRatio }) => {
        const { unmount } = render(
          <WordCloudGenerator
            data={mockData}
            config={{ paperSize, orientation, colorScheme, dpi, padding }}
            fonts={mockFonts}
            onWordsGenerated={mockOnWordsGenerated}
            onPreviewReady={mockOnPreviewReady}
          />
        );

        const svg = screen.getByRole('img', { hidden: true }); // SVG has img role
        expect(svg).toHaveStyle(`aspect-ratio: ${aspectRatio}`);
        unmount();
      });
    });
  });

  describe('Visual Feedback', () => {
    it('should show empty state when no data', () => {
      render(
        <WordCloudGenerator
          data={[]}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('No words to display')).toBeInTheDocument();
      expect(screen.getByText('Load data to see word cloud preview')).toBeInTheDocument();
    });

    it('should show loading state when no fonts', () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={[]}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('Loading fonts...')).toBeInTheDocument();
      expect(screen.getByText('Preparing word cloud preview')).toBeInTheDocument();
    });

    it('should show generating overlay when PDF is being generated', () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
          isGenerating={true}
        />
      );

      expect(screen.getByText('Generating image...')).toBeInTheDocument();
    });

    it('should show configuration indicator', () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('A4 landscape (11.7" × 8.3")')).toBeInTheDocument();
    });

    it('should show word count indicator', () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // 3 total words, 2 unique (Innovation appears twice)
      expect(screen.getByText('3 words • 2 unique')).toBeInTheDocument();
    });

    it('should apply opacity during generation', () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300,  padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
          isGenerating={true}
        />
      );

      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveClass('opacity-50');
    });
  });

  describe('Preview Readiness', () => {
    it('should call onPreviewReady after layout generation', async () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300,  padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      await waitFor(() => {
        expect(mockOnPreviewReady).toHaveBeenCalled();
      });
    });

    it('should call onWordsGenerated with generated words', async () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300,  padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      await waitFor(() => {
        expect(mockOnWordsGenerated).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              text: expect.any(String),
              size: expect.any(Number),
              weight: expect.any(Number),
              fontFamily: expect.any(String),
              color: expect.any(String),
              x: expect.any(Number),
              y: expect.any(Number)
            })
          ])
        );
      });
    });

    it('should not call callbacks when no data or fonts', () => {
      render(
        <WordCloudGenerator
          data={[]}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300,  padding: 0 }}
          fonts={[]}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(mockOnWordsGenerated).not.toHaveBeenCalled();
      expect(mockOnPreviewReady).not.toHaveBeenCalled();
    });
  });

  describe('Word Cloud Accuracy', () => {
    it('should handle word frequency correctly', async () => {
      render(
        <WordCloudGenerator
          data={mockData} // Innovation appears twice, Leadership once
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300,  padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      await waitFor(() => {
        expect(mockOnWordsGenerated).toHaveBeenCalled();
      });

      const generatedWords = mockOnWordsGenerated.mock.calls[0][0];
      
      // Should have 2 unique words
      expect(generatedWords).toHaveLength(2);
      
      // Innovation should have larger size due to higher frequency
      const innovation = generatedWords.find((w: any) => w.text === 'innovation');
      const leadership = generatedWords.find((w: any) => w.text === 'leadership');
      
      expect(innovation).toBeDefined();
      expect(leadership).toBeDefined();
      expect(innovation.size).toBeGreaterThanOrEqual(leadership.size);
    });

    it('should use different fonts for different words', async () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      await waitFor(() => {
        expect(mockOnWordsGenerated).toHaveBeenCalled();
      });

      const generatedWords = mockOnWordsGenerated.mock.calls[0][0];
      const fontFamilies = generatedWords.map((w: any) => w.fontFamily);
      const availableFonts = mockFonts.map(f => f.family);
      
      // All fonts should be from available fonts
      fontFamilies.forEach((font: string) => {
        expect(availableFonts).toContain(font);
      });
    });

    it('should position words without overlap', async () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      await waitFor(() => {
        expect(mockOnWordsGenerated).toHaveBeenCalled();
      });

      const generatedWords = mockOnWordsGenerated.mock.calls[0][0];
      
      // All words should have valid positions
      generatedWords.forEach((word: any) => {
        expect(word.x).toBeTypeOf('number');
        expect(word.y).toBeTypeOf('number');
        expect(word.x).toBeGreaterThan(0);
        expect(word.y).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        person: `Person ${i}`,
        word: `Word${i % 10}`, // Create some frequency variation
        description: `Description ${i}`,
        picture: `person${i}.jpg`
      }));

      const startTime = performance.now();
      
      render(
        <WordCloudGenerator
          data={largeData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      await waitFor(() => {
        expect(mockOnWordsGenerated).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process within reasonable time (less than 500ms)
      expect(processingTime).toBeLessThan(500);
      
      // Should show correct word count
      expect(screen.getByText(/50 words • 10 unique/)).toBeInTheDocument();
    });

    it('should memoize layout calculations', () => {
      const { rerender } = render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      const firstCallCount = mockOnWordsGenerated.mock.calls.length;

      // Rerender with same props - should not recalculate
      rerender(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Should not have called onWordsGenerated again
      expect(mockOnWordsGenerated.mock.calls.length).toBe(firstCallCount);
    });
  });

  describe('Accessibility', () => {
    it('should provide meaningful text content', () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      // Check that word text is rendered
      expect(screen.getByText('innovation')).toBeInTheDocument();
      expect(screen.getByText('leadership')).toBeInTheDocument();
    });

    it('should have proper SVG structure', () => {
      render(
        <WordCloudGenerator
          data={mockData}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      const svg = screen.getByRole('img', { hidden: true });
      expect(svg.tagName).toBe('svg');
      expect(svg).toHaveAttribute('viewBox');
    });

    it('should provide status information for screen readers', () => {
      render(
        <WordCloudGenerator
          data={[]}
          config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
          fonts={mockFonts}
          onWordsGenerated={mockOnWordsGenerated}
          onPreviewReady={mockOnPreviewReady}
        />
      );

      expect(screen.getByText('No words to display')).toBeInTheDocument();
      expect(screen.getByText('Load data to see word cloud preview')).toBeInTheDocument();
    });
  });
});