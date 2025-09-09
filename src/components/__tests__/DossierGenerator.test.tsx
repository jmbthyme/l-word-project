import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DossierGenerator } from '../DossierGenerator';
import type { PersonData } from '../../types';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Page: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div data-testid="pdf-page" data-size={props.size} data-orientation={props.orientation}>
      {children}
    </div>
  ),
  Text: ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <span data-testid="pdf-text" style={style}>{children}</span>
  ),
  View: ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <div data-testid="pdf-view" style={style}>{children}</div>
  ),
  Image: ({ src, style }: { src: string; style?: any }) => (
    <img data-testid="pdf-image" src={src} style={style} alt="" />
  ),
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

describe('DossierGenerator', () => {
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
    },
    {
      person: 'Bob Johnson',
      word: 'Creativity',
      description: 'A creative mind that transforms ideas into reality through innovative approaches.',
      picture: 'bob_johnson.jpg'
    },
    {
      person: 'Alice Brown',
      word: 'Excellence',
      description: 'Committed to delivering high-quality work and exceeding expectations.',
      picture: 'alice_brown.jpg'
    }
  ];

  const mockImages = new Map([
    ['john_doe.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='],
    ['jane_smith.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='],
    ['bob_johnson.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='],
    ['alice_brown.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=']
  ]);

  it('renders a PDF document with correct structure', () => {
    const { getAllByTestId } = render(
      <DossierGenerator data={mockPersonData} images={mockImages} />
    );

    // Should render multiple pages for 4 items (3 items per page = 2 pages)
    const pages = getAllByTestId('pdf-page');
    expect(pages).toHaveLength(2);

    // Each page should be A4 portrait
    pages.forEach(page => {
      expect(page).toHaveAttribute('data-size', 'A4');
      expect(page).toHaveAttribute('data-orientation', 'portrait');
    });
  });

  it('renders person data correctly', () => {
    const { getAllByTestId } = render(
      <DossierGenerator data={mockPersonData.slice(0, 1)} images={mockImages} />
    );

    const texts = getAllByTestId('pdf-text');
    const textContents = texts.map(text => text.textContent);

    // Should include person name, word, and description
    expect(textContents).toContain('John Doe');
    expect(textContents).toContain('Innovation');
    expect(textContents).toContain('A forward-thinking individual who brings creative solutions to complex problems.');
  });

  it('renders images when available', () => {
    const { getAllByTestId } = render(
      <DossierGenerator data={mockPersonData.slice(0, 1)} images={mockImages} />
    );

    const images = getAllByTestId('pdf-image');
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('src', mockImages.get('john_doe.jpg'));
  });

  it('handles missing images gracefully with placeholder', () => {
    const emptyImages = new Map<string, string>();
    const { queryAllByTestId, getAllByTestId } = render(
      <DossierGenerator data={mockPersonData.slice(0, 1)} images={emptyImages} />
    );

    // Should not render any actual images
    const images = queryAllByTestId('pdf-image');
    expect(images).toHaveLength(0);

    // Should render placeholder text
    const texts = getAllByTestId('pdf-text');
    const textContents = texts.map(text => text.textContent);
    expect(textContents).toContain('john_doe.jpg');
    expect(textContents).toContain('Image not found');
  });

  it('handles invalid image data gracefully', () => {
    const invalidImages = new Map([
      ['john_doe.jpg', 'invalid-image-data']
    ]);
    const { queryAllByTestId, getAllByTestId } = render(
      <DossierGenerator data={mockPersonData.slice(0, 1)} images={invalidImages} />
    );

    // Should not render actual images for invalid data
    const images = queryAllByTestId('pdf-image');
    expect(images).toHaveLength(0);

    // Should render placeholder instead
    const texts = getAllByTestId('pdf-text');
    const textContents = texts.map(text => text.textContent);
    expect(textContents).toContain('john_doe.jpg');
    expect(textContents).toContain('Image not found');
  });

  it('calculates pagination correctly with default 2 items per page', () => {
    // Test with exactly 2 items (should be 1 page)
    const { getAllByTestId: getPages1 } = render(
      <DossierGenerator data={mockPersonData.slice(0, 2)} images={mockImages} />
    );
    expect(getPages1('pdf-page')).toHaveLength(1);
  });

  it('calculates pagination correctly with 4 items', () => {
    // Test with 4 items (should be 2 pages with 2 items per page)
    const { getAllByTestId } = render(
      <DossierGenerator data={mockPersonData} images={mockImages} />
    );
    const pages = getAllByTestId('pdf-page');
    expect(pages).toHaveLength(2);
  });

  it('calculates pagination correctly with 5 items', () => {
    // Test with 5 items (should be 3 pages)
    const extendedData = [
      ...mockPersonData,
      { person: 'Test 5', word: 'Word5', description: 'Desc5', picture: 'test5.jpg' }
    ];
    const { getAllByTestId } = render(
      <DossierGenerator data={extendedData} images={mockImages} />
    );
    expect(getAllByTestId('pdf-page')).toHaveLength(3);
  });

  it('respects custom configuration for items per page', () => {
    const config = {
      paperSize: 'A4' as const,
      orientation: 'portrait' as const,
      itemsPerPage: 1,
      highQuality: true
    };

    // Test with 2 items but 1 item per page (should be 2 pages)
    const { getAllByTestId } = render(
      <DossierGenerator 
        data={mockPersonData.slice(0, 2)} 
        images={mockImages} 
        config={config}
      />
    );
    expect(getAllByTestId('pdf-page')).toHaveLength(2);
  });

  it('respects custom paper size configuration', () => {
    const config = {
      paperSize: 'A3' as const,
      orientation: 'landscape' as const,
      itemsPerPage: 2,
      highQuality: true
    };

    const { getAllByTestId } = render(
      <DossierGenerator 
        data={mockPersonData.slice(0, 1)} 
        images={mockImages} 
        config={config}
      />
    );

    const pages = getAllByTestId('pdf-page');
    expect(pages[0]).toHaveAttribute('data-size', 'A3');
    expect(pages[0]).toHaveAttribute('data-orientation', 'landscape');
  });

  it('includes header and footer on each page', () => {
    const { getAllByTestId } = render(
      <DossierGenerator data={mockPersonData} images={mockImages} />
    );

    const texts = getAllByTestId('pdf-text');
    const textContents = texts.map(text => text.textContent);

    // Should include header title on each page
    expect(textContents.filter(text => text === 'Dossier')).toHaveLength(2);

    // Should include page numbers
    expect(textContents).toContain('Page 1 of 2');
    expect(textContents).toContain('Page 2 of 2');

    // Should include footer with date and total entries
    expect(textContents.filter(text => text?.includes('Generated on')).length).toBeGreaterThan(0);
    expect(textContents.filter(text => text?.includes('Total entries: 4')).length).toBeGreaterThan(0);
  });

  it('truncates very long descriptions', () => {
    const longDescriptionData = [{
      person: 'John Doe',
      word: 'Innovation',
      description: 'A'.repeat(600), // Very long description
      picture: 'john_doe.jpg'
    }];

    const { getAllByTestId } = render(
      <DossierGenerator data={longDescriptionData} images={mockImages} />
    );

    const texts = getAllByTestId('pdf-text');
    const descriptionText = texts.find(text => 
      text.textContent?.includes('A'.repeat(100))
    );

    // Should truncate long descriptions
    expect(descriptionText?.textContent).toContain('...');
    expect(descriptionText?.textContent?.length).toBeLessThan(600);
  });

  it('handles empty data array', () => {
    const { queryAllByTestId } = render(
      <DossierGenerator data={[]} images={mockImages} />
    );

    // Should render no pages for empty data
    expect(queryAllByTestId('pdf-page')).toHaveLength(0);
  });

  it('applies consistent styling', () => {
    const { getAllByTestId } = render(
      <DossierGenerator data={mockPersonData.slice(0, 1)} images={mockImages} />
    );

    const views = getAllByTestId('pdf-view');
    const texts = getAllByTestId('pdf-text');

    // Should have style objects applied
    expect(views.length).toBeGreaterThan(0);
    expect(texts.length).toBeGreaterThan(0);

    // Verify some elements have styles
    const styledElements = [...views, ...texts].filter(el => el.style && Object.keys(el.style).length > 0);
    expect(styledElements.length).toBeGreaterThan(0);
  });
});