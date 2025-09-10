import React, { useState } from 'react';
import { DataService } from '../services/DataService';
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
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [folderName, setFolderName] = useState<string>('');

  const dataService = DataService.getInstance();
  const performanceService = PerformanceService.getInstance();
  const errorService = ErrorHandlingService.getInstance();

  const handleFolderSelect = async () => {
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      onError('Folder selection is not supported in this browser. Please use a modern browser like Chrome, Edge, or Safari.');
      return;
    }

    setIsLoading(true);
    setValidationWarnings([]);
    const timer = performanceService.createTimer('Folder Loading');
    
    try {
      // Show directory picker
      const folderHandle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });

      setFolderName(folderHandle.name);

      // Load data from folder
      const result = await dataService.loadDataFolder(folderHandle);

      setLoadedData(result.data);
      setLoadedImages(result.images);

      // Handle validation warnings
      if (result.validation.warnings.length > 0) {
        setValidationWarnings(result.validation.warnings);
        console.warn('Image reference warnings:', result.validation.warnings);
      }

      // Trigger callback with loaded data
      onDataLoad(result.data, result.images);

      // Show success message with warnings if any
      if (result.validation.warnings.length > 0) {
        onError(`Loaded ${result.data.length} entries and ${result.images.size} images. ${result.validation.warnings.length} image references could not be resolved.`);
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // User cancelled the folder selection
          return;
        }
        
        if (error.message.includes('JSON')) {
          onError(`JSON parsing error: ${errorService.sanitizeErrorMessage(error)}`);
        } else if (error.message.includes('No JSON files')) {
          onError('No JSON files found in the selected folder. Please select a folder containing at least one JSON file.');
        } else {
          errorService.handleDataFolderError(error);
          onError(`Failed to load folder: ${errorService.sanitizeErrorMessage(error)}`);
        }
      } else {
        onError('Failed to load folder. Please try again.');
      }
    } finally {
      timer.stop();
      setIsLoading(false);
    }
  };

  // Check if File System Access API is supported
  const isFileSystemAccessSupported = 'showDirectoryPicker' in window;

  const clearData = () => {
    setLoadedData(null);
    setLoadedImages(new Map());
    setValidationWarnings([]);
    setFolderName('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Load Data Folder</h2>

      <div className="space-y-4">
        {/* Folder Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Data Folder
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Choose a folder containing JSON data files and images (PNG, JPG, JPEG).
          </p>
          
          {isFileSystemAccessSupported ? (
            <button
              onClick={handleFolderSelect}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Select Folder'}
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Browser Not Supported
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Folder selection requires a modern browser like Chrome, Edge, or Safari. Please update your browser to use this feature.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {folderName && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Selected folder: {folderName}
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Loading folder contents...</span>
          </div>
        )}

        {/* Loaded Data Summary */}
        {loadedData && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Data Loaded Successfully
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>✓ {loadedData.length} data entries loaded</p>
                  <p>✓ {loadedImages.size} images loaded</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Image Reference Warnings
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="mb-2">Some entries reference images that were not found:</p>
                  <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                    {validationWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
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
            Clear Data
          </button>
        )}
      </div>
    </div>
  );
};