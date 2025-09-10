import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { ErrorHandlingService } from '../ErrorHandlingService';
import type { ValidationError } from '../../types';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe('ErrorHandlingService', () => {
  let errorService: ErrorHandlingService;

  beforeEach(() => {
    errorService = ErrorHandlingService.getInstance();
    errorService.clearErrorLog();
    vi.clearAllMocks();
  });

  it('returns the same instance (singleton)', () => {
    const instance1 = ErrorHandlingService.getInstance();
    const instance2 = ErrorHandlingService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('handles validation errors', () => {
    const validationError: ValidationError = {
      field: 'person',
      message: 'Person name is required'
    };

    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    errorService.handleDataValidationError(validationError);

    expect(console.error).toHaveBeenCalled();
    expect(dispatchEventSpy).toHaveBeenCalled();
    
    dispatchEventSpy.mockRestore();
  });

  it('handles image loading errors gracefully', () => {
    const filename = 'test-image.jpg';
    const error = new Error('Failed to load image');

    errorService.handleImageLoadError(filename, error);

    expect(console.error).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      `Image loading failed for ${filename}, will use fallback`
    );
  });

  it('creates image fallback', () => {
    const filename = 'missing-image.jpg';
    const fallback = errorService.createImageFallback(filename, 300, 200);

    expect(fallback).toMatch(/^data:image\/svg\+xml;base64,/);
    
    const svgContent = atob(fallback.split(',')[1]);
    expect(svgContent).toContain('width="300"');
    expect(svgContent).toContain('height="200"');
    expect(svgContent).toContain('Image Not Found');
    expect(svgContent).toContain(filename);
  });

  it('sanitizes error messages', () => {
    const error = new Error('Error at line 123 (file:///path/to/file.js:123:45)');
    const sanitized = errorService.sanitizeErrorMessage(error);

    expect(sanitized).not.toContain('file:///');
    expect(sanitized).not.toContain('at line');
  });

  it('extracts validation errors', () => {
    const zodError = {
      issues: [
        { path: ['person'], message: 'Person is required' },
        { path: ['word'], message: 'Word is required' }
      ]
    };

    const errors = errorService.extractValidationErrors(zodError);

    expect(errors).toEqual([
      { field: 'person', message: 'Person is required' },
      { field: 'word', message: 'Word is required' }
    ]);
  });

  it('identifies recoverable errors', () => {
    const recoverableError = new Error('Network timeout');
    const nonRecoverableError = new Error('Syntax error');

    expect(errorService.isRecoverableError(recoverableError)).toBe(true);
    expect(errorService.isRecoverableError(nonRecoverableError)).toBe(false);
  });

  it('tracks error statistics', () => {
    errorService.handleDataValidationError({ field: 'person', message: 'Error 1' });
    errorService.handleImageLoadError('image1.jpg', new Error('Error 2'));

    const stats = errorService.getErrorStats();

    expect(stats.total).toBe(2);
    expect(stats.byContext['Data Validation']).toBe(1);
    expect(stats.byContext['Image Loading']).toBe(1);
  });

  it('clears error log', () => {
    errorService.handleDataValidationError({ field: 'person', message: 'Error' });
    
    let stats = errorService.getErrorStats();
    expect(stats.total).toBe(1);

    errorService.clearErrorLog();
    
    stats = errorService.getErrorStats();
    expect(stats.total).toBe(0);
  });
});