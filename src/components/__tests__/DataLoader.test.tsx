import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataLoader } from '../DataLoader';
import type { PersonData } from '../../types';

// Mock FileReader
const mockFileReader = {
  readAsText: vi.fn(),
  readAsDataURL: vi.fn(),
  result: '',
  onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
  onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
};

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader),
});

describe('DataLoader - Core Functionality', () => {
  const mockOnDataLoad = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader.result = '';
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
  });

  const renderDataLoader = () => {
    return render(
      <DataLoader onDataLoad={mockOnDataLoad} onError={mockOnError} />
    );
  };

  describe('Component Rendering', () => {
    it('renders the data loader component with file inputs', () => {
      renderDataLoader();
      
      // Check if elements exist using screen queries
      expect(screen.getByText('Load Data')).toBeDefined();
      expect(screen.getByLabelText('JSON Data File')).toBeDefined();
      expect(screen.getByLabelText('Image Files (PNG, JPG, JPEG)')).toBeDefined();
    });

    it('has correct file input attributes', () => {
      renderDataLoader();
      
      const jsonInput = screen.getByLabelText('JSON Data File') as HTMLInputElement;
      const imageInput = screen.getByLabelText('Image Files (PNG, JPG, JPEG)') as HTMLInputElement;
      
      expect(jsonInput.accept).toBe('.json');
      expect(imageInput.accept).toBe('.png,.jpg,.jpeg,image/png,image/jpeg');
      expect(imageInput.multiple).toBe(true);
    });
  });

  describe('JSON File Loading', () => {
    const validPersonData: PersonData[] = [
      {
        person: 'John Doe',
        word: 'Innovation',
        description: 'A creative thinker',
        picture: 'john.jpg'
      }
    ];

    it('successfully loads valid JSON data', async () => {
      renderDataLoader();
      
      const jsonInput = screen.getByLabelText('JSON Data File');
      const file = new File([JSON.stringify(validPersonData)], 'data.json', {
        type: 'application/json'
      });

      mockFileReader.readAsText = vi.fn().mockImplementation(() => {
        mockFileReader.result = JSON.stringify(validPersonData);
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      });

      fireEvent.change(jsonInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('✓ Loaded 1 data entries')).toBeDefined();
      });
    });

    it('handles invalid JSON format', async () => {
      renderDataLoader();
      
      const jsonInput = screen.getByLabelText('JSON Data File');
      const file = new File(['invalid json'], 'data.json', {
        type: 'application/json'
      });

      mockFileReader.readAsText = vi.fn().mockImplementation(() => {
        mockFileReader.result = 'invalid json';
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      });

      fireEvent.change(jsonInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid JSON format. Please check your file.');
      });
    });

    it('handles validation errors', async () => {
      renderDataLoader();
      
      const invalidData = [{ person: 'John' }]; // Missing required fields

      const jsonInput = screen.getByLabelText('JSON Data File');
      const file = new File([JSON.stringify(invalidData)], 'data.json', {
        type: 'application/json'
      });

      mockFileReader.readAsText = vi.fn().mockImplementation(() => {
        mockFileReader.result = JSON.stringify(invalidData);
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      });

      fireEvent.change(jsonInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining('Data validation failed:')
        );
      });
    });
  });

  describe('Image File Loading', () => {
    it('successfully loads valid image files', async () => {
      renderDataLoader();
      
      const imageInput = screen.getByLabelText('Image Files (PNG, JPG, JPEG)');
      const file1 = new File(['image1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['image2'], 'image2.png', { type: 'image/png' });

      mockFileReader.readAsDataURL = vi.fn().mockImplementation(() => {
        mockFileReader.result = 'data:image/jpeg;base64,mockbase64data';
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      });

      fireEvent.change(imageInput, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(screen.getByText('✓ Loaded 2 images')).toBeDefined();
      });
    });

    it('rejects invalid image file formats', async () => {
      renderDataLoader();
      
      const imageInput = screen.getByLabelText('Image Files (PNG, JPG, JPEG)');
      const file = new File(['document'], 'document.pdf', { type: 'application/pdf' });

      fireEvent.change(imageInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          'Image loading failed: Invalid image format for file "document.pdf". Supported formats: PNG, JPG, JPEG'
        );
      });
    });
  });

  describe('Combined Data Loading', () => {
    it('calls onDataLoad when both JSON and images are loaded', async () => {
      renderDataLoader();
      
      const validPersonData: PersonData[] = [
        {
          person: 'John Doe',
          word: 'Innovation',
          description: 'A creative thinker',
          picture: 'john.jpg'
        }
      ];

      // Load JSON first
      const jsonInput = screen.getByLabelText('JSON Data File');
      const jsonFile = new File([JSON.stringify(validPersonData)], 'data.json', {
        type: 'application/json'
      });

      mockFileReader.readAsText = vi.fn().mockImplementation(() => {
        mockFileReader.result = JSON.stringify(validPersonData);
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      });

      fireEvent.change(jsonInput, { target: { files: [jsonFile] } });

      await waitFor(() => {
        expect(screen.getByText('✓ Loaded 1 data entries')).toBeDefined();
      });

      // Then load images
      const imageInput = screen.getByLabelText('Image Files (PNG, JPG, JPEG)');
      const imageFile = new File(['image'], 'john.jpg', { type: 'image/jpeg' });

      mockFileReader.readAsDataURL = vi.fn().mockImplementation(() => {
        mockFileReader.result = 'data:image/jpeg;base64,mockbase64data';
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      });

      fireEvent.change(imageInput, { target: { files: [imageFile] } });

      await waitFor(() => {
        expect(mockOnDataLoad).toHaveBeenCalledWith(
          validPersonData,
          expect.any(Map)
        );
      });
    });
  });

  describe('UI Interactions', () => {
    it('shows clear button when data is loaded', async () => {
      renderDataLoader();
      
      const validPersonData: PersonData[] = [
        {
          person: 'John Doe',
          word: 'Innovation',
          description: 'A creative thinker',
          picture: 'john.jpg'
        }
      ];

      const jsonInput = screen.getByLabelText('JSON Data File');
      const file = new File([JSON.stringify(validPersonData)], 'data.json', {
        type: 'application/json'
      });

      mockFileReader.readAsText = vi.fn().mockImplementation(() => {
        mockFileReader.result = JSON.stringify(validPersonData);
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      });

      fireEvent.change(jsonInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Clear All Data')).toBeDefined();
      });
    });

    it('clears all data when clear button is clicked', async () => {
      renderDataLoader();
      
      const validPersonData: PersonData[] = [
        {
          person: 'John Doe',
          word: 'Innovation',
          description: 'A creative thinker',
          picture: 'john.jpg'
        }
      ];

      const jsonInput = screen.getByLabelText('JSON Data File');
      const file = new File([JSON.stringify(validPersonData)], 'data.json', {
        type: 'application/json'
      });

      mockFileReader.readAsText = vi.fn().mockImplementation(() => {
        mockFileReader.result = JSON.stringify(validPersonData);
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      });

      fireEvent.change(jsonInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('✓ Loaded 1 data entries')).toBeDefined();
      });

      const clearButton = screen.getByText('Clear All Data');
      fireEvent.click(clearButton);

      expect(screen.queryByText('✓ Loaded 1 data entries')).toBeNull();
      expect(screen.queryByText('Clear All Data')).toBeNull();
    });
  });
});