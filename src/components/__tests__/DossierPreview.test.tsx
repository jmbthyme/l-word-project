import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DossierPreview } from '../DossierPreview';
import type { PersonData } from '../../types';

describe('DossierPreview', () => {
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

  it('renders preview with correct title and summary', () => {
    render(<DossierPreview data={mockPersonData} images={mockImages} />);

    expect(screen.getByText('Dossier Preview')).toBeInTheDocument();
    expect(screen.getByText('Preview of 4 entries across 2 pages (A4 Portrait)')).toBeInTheDocument();
  });

  it('renders person data correctly', () => {
    render(<DossierPreview data={mockPersonData.slice(0, 1)} images={mockImages} />);

    // Should display person name as header
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Should display word with label
    expect(screen.getByText('Word:')).toBeInTheDocument();
    expect(screen.getByText('Innovation')).toBeInTheDocument();
    
    // Should display description with label
    expect(screen.getByText('Description:')).toBeInTheDocument();
    expect(screen.getByText('A forward-thinking individual who brings creative solutions to complex problems.')).toBeInTheDocument();
  });

  it('renders images when available', () => {
    render(<DossierPreview data={mockPersonData.slice(0, 1)} images={mockImages} />);

    const image = screen.getByAltText('Picture of John Doe');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockImages.get('john_doe.jpg'));
  });

  it('handles missing images gracefully', () => {
    const emptyImages = new Map<string, string>();
    render(<DossierPreview data={mockPersonData.slice(0, 1)} images={emptyImages} />);

    // Should not render any images
    expect(screen.queryByAltText('Picture of John Doe')).not.toBeInTheDocument();
    
    // But should still render text content
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Innovation')).toBeInTheDocument();
  });

  it('calculates pagination correctly', () => {
    // Test with 4 items (should show 2 pages)
    render(<DossierPreview data={mockPersonData} images={mockImages} />);
    
    expect(screen.getByText('Preview of 4 entries across 2 pages (A4 Portrait)')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('handles single page correctly', () => {
    render(<DossierPreview data={mockPersonData.slice(0, 2)} images={mockImages} />);
    
    expect(screen.getByText('Preview of 2 entries across 1 page (A4 Portrait)')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('displays page headers and footers', () => {
    render(<DossierPreview data={mockPersonData.slice(0, 1)} images={mockImages} />);

    // Should show page header
    expect(screen.getByText('Dossier')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();

    // Should show footer with current date
    const dateText = new Date().toLocaleDateString();
    expect(screen.getByText(`Generated on ${dateText}`)).toBeInTheDocument();
  });

  it('handles empty data array', () => {
    render(<DossierPreview data={[]} images={mockImages} />);

    expect(screen.getByText('No data to preview. Please load data first.')).toBeInTheDocument();
    expect(screen.queryByText('Dossier Preview')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <DossierPreview data={mockPersonData.slice(0, 1)} images={mockImages} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders all person data across multiple pages', () => {
    render(<DossierPreview data={mockPersonData} images={mockImages} />);

    // Should render all person names
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();

    // Should render all words
    expect(screen.getByText('Innovation')).toBeInTheDocument();
    expect(screen.getByText('Leadership')).toBeInTheDocument();
    expect(screen.getByText('Creativity')).toBeInTheDocument();
    expect(screen.getByText('Excellence')).toBeInTheDocument();
  });

  it('maintains proper layout structure', () => {
    render(<DossierPreview data={mockPersonData.slice(0, 1)} images={mockImages} />);

    // Should have proper CSS classes for layout
    const wordSection = screen.getByText('Word:').closest('div');
    const descriptionSection = screen.getByText('Description:').closest('div');
    
    expect(wordSection).toHaveClass('mb-3');
    expect(descriptionSection).toHaveClass('mb-3');

    // Image should have proper styling
    const image = screen.getByAltText('Picture of John Doe');
    expect(image).toHaveClass('w-full', 'h-full', 'object-cover', 'rounded-lg');
  });

  it('shows scrollable container for multiple pages', () => {
    render(<DossierPreview data={mockPersonData} images={mockImages} />);

    // Should have scrollable container
    const scrollContainer = screen.getByText('Page 1 of 2').closest('.max-h-96');
    expect(scrollContainer).toHaveClass('overflow-y-auto');
  });
});