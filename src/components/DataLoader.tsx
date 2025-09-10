import React, { useState, useRef } from 'react';
import { validatePersonData, validateImageFile } from '../validation/validators';
import type { PersonData, ValidationError } from '../types';
import { PerformanceService } from '../services/PerformanceService';
import { ErrorHandlingService } from '../services/ErrorHandlingService';

interface DataLoaderProps {
  onDataLoad: (data: PersonData[], images: Map<string, string>) => void;
  onError: (error: string) => void;
  onValidationErrors?: (errors: ValidationError[]) => void;
}

export const DataLoader: React.FC<DataLoaderProps> = ({ onDataLoad, onError, onValidationErrors }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState<PersonData[] | null>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, string>>(new Map());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [imageErrors, setImageErrors] = useState<string[]>([]);

  const jsonFileRef = useRef<HTMLInputElement>(null);
  const imageFilesRef = useRef<HTMLInputElement>(null);
  const performanceService = PerformanceService.getInstance();
  const errorService = ErrorHandlingService.getInstance();

  const handleJsonFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setValidationErrors([]);
    
    try {
      const text = await readFileAsText(file);
      const jsonData = JSON.parse(text);
      const validatedData = validatePersonData(jsonData);

      setLoadedData(validatedData);

      // If images are already loaded, trigger onDataLoad
      if (loadedImages.size > 0) {
        onDataLoad(validatedData, loadedImages);
      }

    } catch (error) {
      if (error instanceof SyntaxError) {
        const friendlyError = 'Invalid JSON format. Please check your file for syntax errors.';
        onError(friendlyError);
      } else if (error instanceof Error) {
        // Extract detailed validation errors if available
        const detailedErrors = errorService.extractValidationErrors(error);
        
        if (detailedErrors.length > 0) {
          setValidationErrors(detailedErrors);
          if (onValidationErrors) {
            onValidationErrors(detailedErrors);
          }
          
          // Create user-friendly error message
          const errorSummary = detailedErrors.length === 1 
            ? `Validation error: ${detailedErrors[0].message}`
            : `Found ${detailedErrors.length} validation errors. Please check the highlighted fields.`;
          
          onError(errorSummary);
        } else {
          const sanitizedMessage = errorService.sanitizeErrorMessage(error);
          onError(`Data validation failed: ${sanitizedMessage}`);
        }
        
        // Handle validation error through error service
        if (detailedErrors.length > 0) {
          detailedErrors.forEach(validationError => {
            errorService.handleDataValidationError(validationError);
          });
        }
      } else {
        onError('Failed to load JSON file. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFilesLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setImageErrors([]);
    const timer = performanceService.createTimer('Image Loading');
    
    try {
      // Check file count for performance warning
      if (files.length > 50) {
        console.warn(`Large number of images detected (${files.length}). Loading may take longer.`);
      }

      const { imageMap, errors } = await loadImagesWithFallback(files);
      
      // Set image errors for display
      if (errors.length > 0) {
        setImageErrors(errors);
        console.warn(`${errors.length} images failed to load and will use fallbacks`);
      }
      
      // Compress and optimize images with error handling
      const optimizedImages = await errorService.withRetry(
        () => performanceService.compressAndCacheImages(imageMap),
        2,
        1000,
        'Image Compression'
      );
      
      setLoadedImages(optimizedImages);

      // If JSON data is already loaded, trigger onDataLoad
      if (loadedData) {
        onDataLoad(loadedData, optimizedImages);
      }

      // Show success message with warnings if needed
      if (errors.length > 0) {
        onError(`Loaded ${imageMap.size} images successfully. ${errors.length} images failed and will use placeholders.`);
      }

    } catch (error) {
      if (error instanceof Error) {
        const sanitizedMessage = errorService.sanitizeErrorMessage(error);
        onError(`Image loading failed: ${sanitizedMessage}`);
      } else {
        onError('Failed to load image files. Please try again.');
      }
    } finally {
      timer.stop();
      setIsLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const loadImagesWithFallback = async (files: FileList): Promise<{ imageMap: Map<string, string>; errors: string[] }> => {
    const imageMap = new Map<string, string>();
    const errors: string[] = [];
    const loadPromises: Promise<{ filename: string; success: boolean; data?: string; error?: string }>[] = [];
    const maxFileSize = 5 * 1024 * 1024; // 5MB per file

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!validateImageFile(file)) {
        errors.push(`Invalid format: ${file.name}`);
        // Create fallback for invalid format
        const fallbackData = errorService.createImageFallback(file.name);
        imageMap.set(file.name, fallbackData);
        continue;
      }

      // Check file size for performance
      if (file.size > maxFileSize) {
        console.warn(`Large image file detected: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
      }

      const loadPromise = new Promise<{ filename: string; success: boolean; data?: string; error?: string }>((resolve) => {
        const reader = new FileReader();
        
        // Add timeout for file reading
        const timeoutId = setTimeout(() => {
          resolve({
            filename: file.name,
            success: false,
            error: 'Timeout reading file'
          });
        }, 10000); // 10 second timeout

        reader.onload = () => {
          clearTimeout(timeoutId);
          resolve({
            filename: file.name,
            success: true,
            data: reader.result as string
          });
        };
        
        reader.onerror = () => {
          clearTimeout(timeoutId);
          resolve({
            filename: file.name,
            success: false,
            error: 'Failed to read file'
          });
        };
        
        reader.readAsDataURL(file);
      });

      loadPromises.push(loadPromise);
    }

    // Process images with concurrency control
    const results = await Promise.allSettled(loadPromises);
    
    // Process results and create fallbacks for failures
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { filename, success, data, error } = result.value;
        
        if (success && data) {
          imageMap.set(filename, data);
        } else {
          errors.push(`${filename}: ${error || 'Unknown error'}`);
          // Create fallback image
          const fallbackData = errorService.createImageFallback(filename);
          imageMap.set(filename, fallbackData);
          
          // Report error to error service
          errorService.handleImageLoadError(filename, new Error(error || 'Unknown error'));
        }
      } else {
        // This shouldn't happen since we're resolving all promises, but just in case
        errors.push(`Unexpected error processing images`);
      }
    });

    return { imageMap, errors };
  };

  const clearData = () => {
    setLoadedData(null);
    setLoadedImages(new Map());
    setValidationErrors([]);
    setImageErrors([]);
    if (jsonFileRef.current) jsonFileRef.current.value = '';
    if (imageFilesRef.current) imageFilesRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Load Data</h2>

      <div className="space-y-4">
        {/* JSON File Input */}
        <div>
          <label htmlFor="json-file" className="block text-sm font-medium text-gray-700 mb-2">
            JSON Data File
          </label>
          <input
            ref={jsonFileRef}
            id="json-file"
            type="file"
            accept=".json"
            onChange={handleJsonFileLoad}
            disabled={isLoading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {loadedData && (
            <p className="text-sm text-green-600 mt-1">
              ✓ Loaded {loadedData.length} data entries
            </p>
          )}
        </div>

        {/* Image Files Input */}
        <div>
          <label htmlFor="image-files" className="block text-sm font-medium text-gray-700 mb-2">
            Image Files (PNG, JPG, JPEG)
          </label>
          <input
            ref={imageFilesRef}
            id="image-files"
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            multiple
            onChange={handleImageFilesLoad}
            disabled={isLoading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
          />
          {loadedImages.size > 0 && (
            <p className="text-sm text-green-600 mt-1">
              ✓ Loaded {loadedImages.size} images
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Data Validation Errors
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>
                        <strong>{error.field}:</strong> {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Loading Errors */}
        {imageErrors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Image Loading Issues
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="mb-2">The following images failed to load and will use placeholders:</p>
                  <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                    {imageErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clear Button */}
        {(loadedData || loadedImages.size > 0) && (
          <button
            onClick={clearData}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Clear All Data
          </button>
        )}
      </div>
    </div>
  );
};