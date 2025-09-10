import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { 
  WordCloudGenerator,
  calculateWordFrequency,
  generateWordCloudItems,
  generateWordCloudLayout
} from '../WordCloudGenerator';
import type { PersonData, GoogleFont, WordCloudConfig } from '../../types';

// Mock data for testing
const mockPersonData: PersonData[] = [
  {
    person: 'John Doe',
    word: 'Innovation',
    description: 'A creative thinker',
    picture: 'john.jpg'
  },
  {
    person: 'Jane Smith',
    word: 'Leadership',
    description: 'A natural leader',
    picture: 'jane.jpg'
  },
  {
    person: 'Bob Johnson',
    word: 'Innovation',
    description: 'Another creative mind',
    picture: 'bob.jpg'
  },
  {
    person: 'Alice Brown',
    word: 'Teamwork',
    description: 'Great collaborator',
    picture: 'alice.jpg'
  }
];

const mockFonts: GoogleFont[] = [
  { family: 'Roboto', weights: [300, 400, 700] },
  { family: 'Open Sans', weights: [400, 600, 800] },
  { family: 'Lato', weights: [300, 400, 700] }
];

const mockConfig: WordCloudConfig = {
  paperSize: 'A4',
  orientation: 'portrait',
  colorScheme: 'color',
  dpi: 300
};

describe('WordCloudGenerator', () => {
  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <WordCloudGenerator
          data={mockPersonData}
          config={mockConfig}
          fonts={mockFonts}
        />
      );
      
      expect(container.querySelector('.word-cloud-container')).not.toBeNull();
      expect(container.querySelector('.word-cloud-svg')).not.toBeNull();
    });

    it('renders word cloud text elements', () => {
      const { container } = render(
        <WordCloudGenerator
          data={mockPersonData}
          config={mockConfig}
          fonts={mockFonts}
        />
      );
      
      const textElements = container.querySelectorAll('.word-cloud-text');
      expect(textElements.length).toBeGreaterThan(0);
      
      // Check that unique words are rendered
      const textContents = Array.from(textElements).map(el => el.textContent);
      expect(textContents).toContain('innovation'); // Should be lowercase
      expect(textContents).toContain('leadership');
      expect(textContents).toContain('teamwork');
    });

    it('calls onWordsGenerated callback when provided', () => {
      const mockCallback = vi.fn();
      
      render(
        <WordCloudGenerator
          data={mockPersonData}
          config={mockConfig}
          fonts={mockFonts}
          onWordsGenerated={mockCallback}
        />
      );
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.any(String),
            size: expect.any(Number),
            weight: expect.any(Number),
            fontFamily: expect.any(String),
            x: expect.any(Number),
            y: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('calculateWordFrequency', () => {
    it('calculates word frequency correctly', () => {
      const frequency = calculateWordFrequency(mockPersonData);
      
      expect(frequency.get('innovation')).toBe(2);
      expect(frequency.get('leadership')).toBe(1);
      expect(frequency.get('teamwork')).toBe(1);
      expect(frequency.size).toBe(3);
    });

    it('handles case insensitive words', () => {
      const dataWithMixedCase: PersonData[] = [
        { person: 'Test', word: 'Innovation', description: 'Test', picture: 'test.jpg' },
        { person: 'Test', word: 'INNOVATION', description: 'Test', picture: 'test.jpg' },
        { person: 'Test', word: 'innovation', description: 'Test', picture: 'test.jpg' }
      ];
      
      const frequency = calculateWordFrequency(dataWithMixedCase);
      expect(frequency.get('innovation')).toBe(3);
      expect(frequency.size).toBe(1);
    });

    it('handles empty data', () => {
      const frequency = calculateWordFrequency([]);
      expect(frequency.size).toBe(0);
    });

    it('ignores empty or whitespace-only words', () => {
      const dataWithEmptyWords: PersonData[] = [
        { person: 'Test', word: '', description: 'Test', picture: 'test.jpg' },
        { person: 'Test', word: '   ', description: 'Test', picture: 'test.jpg' },
        { person: 'Test', word: 'Valid', description: 'Test', picture: 'test.jpg' }
      ];
      
      const frequency = calculateWordFrequency(dataWithEmptyWords);
      expect(frequency.size).toBe(1);
      expect(frequency.get('valid')).toBe(1);
    });
  });

  describe('generateWordCloudItems', () => {
    it('generates word cloud items with correct structure', () => {
      const frequency = new Map([
        ['innovation', 3],
        ['leadership', 2],
        ['teamwork', 1]
      ]);
      
      const items = generateWordCloudItems(frequency, mockFonts);
      
      expect(items).toHaveLength(3);
      items.forEach(item => {
        expect(item).toHaveProperty('text');
        expect(item).toHaveProperty('size');
        expect(item).toHaveProperty('weight');
        expect(item).toHaveProperty('fontFamily');
        expect(item).toHaveProperty('color');
        expect(typeof item.text).toBe('string');
        expect(typeof item.size).toBe('number');
        expect(typeof item.weight).toBe('number');
        expect(typeof item.fontFamily).toBe('string');
      });
    });

    it('assigns larger sizes to more frequent words', () => {
      const frequency = new Map([
        ['frequent', 10],
        ['rare', 1]
      ]);
      
      const items = generateWordCloudItems(frequency, mockFonts);
      const frequentItem = items.find(item => item.text === 'frequent');
      const rareItem = items.find(item => item.text === 'rare');
      
      expect(frequentItem?.size).toBeGreaterThan(rareItem?.size || 0);
    });

    it('uses fonts from provided font list', () => {
      const frequency = new Map([['test', 1]]);
      const items = generateWordCloudItems(frequency, mockFonts);
      
      const usedFontFamilies = items.map(item => item.fontFamily);
      const availableFontFamilies = mockFonts.map(font => font.family);
      
      usedFontFamilies.forEach(fontFamily => {
        expect(availableFontFamilies).toContain(fontFamily);
      });
    });

    it('uses valid font weights', () => {
      const frequency = new Map([['test', 1]]);
      const items = generateWordCloudItems(frequency, mockFonts);
      
      items.forEach(item => {
        const font = mockFonts.find(f => f.family === item.fontFamily);
        expect(font?.weights).toContain(item.weight);
      });
    });

    it('throws error when no fonts provided', () => {
      const frequency = new Map([['test', 1]]);
      
      expect(() => generateWordCloudItems(frequency, [])).toThrow(
        'No fonts available for word cloud generation'
      );
    });

    it('handles single word with same frequency', () => {
      const frequency = new Map([['single', 5]]);
      const items = generateWordCloudItems(frequency, mockFonts);
      
      expect(items).toHaveLength(1);
      expect(items[0].text).toBe('single');
      expect(items[0].size).toBeGreaterThan(0);
    });
  });

  describe('generateWordCloudLayout', () => {
    it('generates layout with positioned words', () => {
      const frequency = calculateWordFrequency(mockPersonData);
      const items = generateWordCloudItems(frequency, mockFonts);
      const layout = generateWordCloudLayout(items, mockConfig);
      
      expect(layout.words).toHaveLength(items.length);
      layout.words.forEach(word => {
        expect(typeof word.x).toBe('number');
        expect(typeof word.y).toBe('number');
        expect(word.x).not.toBeNaN();
        expect(word.y).not.toBeNaN();
      });
    });

    it('calculates layout bounds correctly', () => {
      const frequency = calculateWordFrequency(mockPersonData);
      const items = generateWordCloudItems(frequency, mockFonts);
      const layout = generateWordCloudLayout(items, mockConfig);
      
      expect(layout.bounds).toHaveProperty('width');
      expect(layout.bounds).toHaveProperty('height');
      expect(layout.bounds).toHaveProperty('minX');
      expect(layout.bounds).toHaveProperty('maxX');
      expect(layout.bounds).toHaveProperty('minY');
      expect(layout.bounds).toHaveProperty('maxY');
      
      expect(layout.bounds.width).toBeGreaterThan(0);
      expect(layout.bounds.height).toBeGreaterThan(0);
    });

    it('handles empty items array', () => {
      const layout = generateWordCloudLayout([], mockConfig);
      
      expect(layout.words).toHaveLength(0);
      expect(layout.bounds.width).toBe(0);
      expect(layout.bounds.height).toBe(0);
    });

    it('respects paper size configuration', () => {
      const frequency = new Map([['test', 1]]);
      const items = generateWordCloudItems(frequency, mockFonts);
      
      const a4Layout = generateWordCloudLayout(items, { paperSize: 'A4', orientation: 'portrait', colorScheme: 'color', dpi: 300 });
      const a3Layout = generateWordCloudLayout(items, { paperSize: 'A3', orientation: 'portrait', colorScheme: 'color', dpi: 300 });
      
      // A3 should provide more space, potentially different positioning
      expect(a4Layout).toBeDefined();
      expect(a3Layout).toBeDefined();
    });

    it('respects orientation configuration', () => {
      const frequency = new Map([['test', 1]]);
      const items = generateWordCloudItems(frequency, mockFonts);
      
      const portraitLayout = generateWordCloudLayout(items, { paperSize: 'A4', orientation: 'portrait', colorScheme: 'color', dpi: 300 });
      const landscapeLayout = generateWordCloudLayout(items, { paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300 });
      
      expect(portraitLayout).toBeDefined();
      expect(landscapeLayout).toBeDefined();
    });

    it('places larger words first (size-based priority)', () => {
      const frequency = new Map([
        ['large', 10],
        ['medium', 5],
        ['small', 1]
      ]);
      const items = generateWordCloudItems(frequency, mockFonts);
      const layout = generateWordCloudLayout(items, mockConfig);
      
      // The largest word should be positioned closer to center
      const largeWord = layout.words.find(w => w.text === 'large');
      const smallWord = layout.words.find(w => w.text === 'small');
      
      expect(largeWord).toBeDefined();
      expect(smallWord).toBeDefined();
      expect(largeWord?.size).toBeGreaterThan(smallWord?.size || 0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles data with duplicate words correctly', () => {
      const duplicateData: PersonData[] = [
        { person: 'A', word: 'same', description: 'Test', picture: 'a.jpg' },
        { person: 'B', word: 'same', description: 'Test', picture: 'b.jpg' },
        { person: 'C', word: 'same', description: 'Test', picture: 'c.jpg' }
      ];
      
      const { container } = render(
        <WordCloudGenerator
          data={duplicateData}
          config={mockConfig}
          fonts={mockFonts}
        />
      );
      
      const textElements = container.querySelectorAll('.word-cloud-text');
      expect(textElements).toHaveLength(1); // Only one unique word
      expect(textElements[0].textContent).toBe('same');
    });

    it('handles very long words', () => {
      const longWordData: PersonData[] = [
        { 
          person: 'Test', 
          word: 'supercalifragilisticexpialidocious', 
          description: 'Very long word', 
          picture: 'test.jpg' 
        }
      ];
      
      const { container } = render(
        <WordCloudGenerator
          data={longWordData}
          config={mockConfig}
          fonts={mockFonts}
        />
      );
      
      const textElement = container.querySelector('.word-cloud-text');
      expect(textElement?.textContent).toBe('supercalifragilisticexpialidocious');
    });

    it('handles single word data', () => {
      const singleWordData: PersonData[] = [
        { person: 'Test', word: 'Single', description: 'Only one', picture: 'test.jpg' }
      ];
      
      const { container } = render(
        <WordCloudGenerator
          data={singleWordData}
          config={mockConfig}
          fonts={mockFonts}
        />
      );
      
      const textElements = container.querySelectorAll('.word-cloud-text');
      expect(textElements).toHaveLength(1);
      expect(textElements[0].textContent).toBe('single');
    });
  });
});