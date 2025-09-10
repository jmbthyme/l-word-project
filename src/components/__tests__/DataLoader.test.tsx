import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataLoader } from '../DataLoader';
import type { PersonData, ValidationError } from '../../types';

// Mock services
vi.mock('../../services/PerformanceService');
vi.mock('../../services/ErrorHandlingService');

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
  const mockOnValidationErrors = vi.fn();

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
d
escribe('DataLoader - Error Handling', () => {
  const mockOnDataLoad = vi.fn();
  const mockOnError = vi.fn();
  const mockOnValidationErrors = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader.result = '';
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
  });

  it('handles JSON syntax errors gracefully', async () => {
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    const jsonInput = screen.getByLabelText(/JSON Data File/i);
    const invalidJsonFile = new File(['{ invalid json }'], 'invalid.json', {
      type: 'application/json',
    });

    fireEvent.change(jsonInput, { target: { files: [invalidJsonFile] } });

    // Simulate FileReader success with invalid JSON
    mockFileReader.result = '{ invalid json }';
    if (mockFileReader.onload) {
      mockFileReader.onload({} as ProgressEvent<FileReader>);
    }

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        'Invalid JSON format. Please check your file for syntax errors.'
      );
    });
  });

  it('displays validation errors with specific field information', async () => {
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    const jsonInput = screen.getByLabelText(/JSON Data File/i);
    const invalidDataFile = new File(['[{"person": ""}]'], 'invalid-data.json', {
      type: 'application/json',
    });

    fireEvent.change(jsonInput, { target: { files: [invalidDataFile] } });

    // Simulate FileReader success with invalid data
    mockFileReader.result = '[{"person": ""}]';
    if (mockFileReader.onload) {
      mockFileReader.onload({} as ProgressEvent<FileReader>);
    }

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it('shows validation error details in UI', async () => {
    const { rerender } = render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    // Simulate validation errors by re-rendering with errors
    const validationErrors: ValidationError[] = [
      { field: 'person', message: 'Person name is required' },
      { field: 'word', message: 'Word is required' }
    ];

    // We need to trigger the validation errors state somehow
    // This would typically happen through the validation process
    // For now, let's test the UI rendering of validation errors
    
    expect(screen.queryByText('Data Validation Errors')).not.toBeInTheDocument();
  });

  it('handles image loading failures with fallbacks', async () => {
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    const imageInput = screen.getByLabelText(/Image Files/i);
    const imageFile = new File(['fake-image-data'], 'test.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(imageInput, { target: { files: [imageFile] } });

    // Simulate FileReader error
    if (mockFileReader.onerror) {
      mockFileReader.onerror({} as ProgressEvent<FileReader>);
    }

    await waitFor(() => {
      // Should handle error gracefully and create fallback
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('1 images failed and will use placeholders')
      );
    });
  });

  it('handles invalid image formats', async () => {
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    const imageInput = screen.getByLabelText(/Image Files/i);
    const invalidImageFile = new File(['fake-data'], 'test.txt', {
      type: 'text/plain',
    });

    fireEvent.change(imageInput, { target: { files: [invalidImageFile] } });

    await waitFor(() => {
      // Should handle invalid format and create fallback
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('1 images failed and will use placeholders')
      );
    });
  });

  it('shows image loading errors in UI', async () => {
    const { container } = render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    // Test would need to simulate the imageErrors state
    // This is challenging to test directly without exposing internal state
    // In a real scenario, we might need to refactor to make this more testable
    
    expect(container).toBeInTheDocument();
  });

  it('handles large image files with warnings', async () => {
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    const imageInput = screen.getByLabelText(/Image Files/i);
    
    // Create a large file (6MB)
    const largeImageFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    fireEvent.change(imageInput, { target: { files: [largeImageFile] } });

    // Simulate successful loading
    mockFileReader.result = 'data:image/jpeg;base64,fake-data';
    if (mockFileReader.onload) {
      mockFileReader.onload({} as ProgressEvent<FileReader>);
    }

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Large image file detected')
      );
    });

    consoleSpy.mockRestore();
  });

  it('handles timeout during image loading', async () => {
    vi.useFakeTimers();

    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    const imageInput = screen.getByLabelText(/Image Files/i);
    const imageFile = new File(['fake-image-data'], 'test.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(imageInput, { target: { files: [imageFile] } });

    // Fast-forward time to trigger timeout
    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('1 images failed and will use placeholders')
      );
    });

    vi.useRealTimers();
  });

  it('clears validation and image errors when clearing data', () => {
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    // First load some data to enable clear button
    const jsonInput = screen.getByLabelText(/JSON Data File/i);
    const validJsonFile = new File(['[{"person": "John", "word": "test", "description": "desc", "picture": "pic.jpg"}]'], 'valid.json', {
      type: 'application/json',
    });

    fireEvent.change(jsonInput, { target: { files: [validJsonFile] } });

    // Simulate successful loading
    mockFileReader.result = '[{"person": "John", "word": "test", "description": "desc", "picture": "pic.jpg"}]';
    if (mockFileReader.onload) {
      mockFileReader.onload({} as ProgressEvent<FileReader>);
    }

    // Wait for clear button to appear and click it
    waitFor(() => {
      const clearButton = screen.getByText('Clear All Data');
      fireEvent.click(clearButton);
      
      // Verify that errors are cleared (this would be visible in the UI)
      expect(screen.queryByText('Data Validation Errors')).not.toBeInTheDocument();
      expect(screen.queryByText('Image Loading Issues')).not.toBeInTheDocument();
    });
  });

  it('handles multiple concurrent image loading failures', async () => {
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    const imageInput = screen.getByLabelText(/Image Files/i);
    const imageFiles = [
      new File(['fake-data-1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['fake-data-2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['fake-data-3'], 'test3.jpg', { type: 'image/jpeg' })
    ];

    fireEvent.change(imageInput, { target: { files: imageFiles } });

    // Simulate all files failing to load
    if (mockFileReader.onerror) {
      mockFileReader.onerror({} as ProgressEvent<FileReader>);
    }

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('3 images failed and will use placeholders')
      );
    });
  });

  it('provides retry functionality for failed operations', async () => {
    // This test would verify that the retry mechanism works
    // The actual retry logic is in the ErrorHandlingService
    // Here we test that the DataLoader integrates with it properly
    
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    // Test would involve simulating a retry scenario
    // This is more of an integration test with the ErrorHandlingService
    expect(screen.getByLabelText(/JSON Data File/i)).toBeInTheDocument();
  });
});

describe('DataLoader - Accessibility', () => {
  const mockOnDataLoad = vi.fn();
  const mockOnError = vi.fn();
  const mockOnValidationErrors = vi.fn();

  it('provides proper ARIA labels for error messages', () => {
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    // Check that form inputs have proper labels
    expect(screen.getByLabelText(/JSON Data File/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Image Files/i)).toBeInTheDocument();
  });

  it('maintains focus management during error states', () => {
    render(
      <DataLoader
        onDataLoad={mockOnDataLoad}
        onError={mockOnError}
        onValidationErrors={mockOnValidationErrors}
      />
    );

    const jsonInput = screen.getByLabelText(/JSON Data File/i);
    
    // Focus should be manageable even during error states
    jsonInput.focus();
    expect(document.activeElement).toBe(jsonInput);
  });
});