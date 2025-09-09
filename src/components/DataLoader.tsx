import React, { useState, useRef } from 'react';
import { validatePersonData, validateImageFile } from '../validation/validators';
import type { PersonData } from '../types';

interface DataLoaderProps {
  onDataLoad: (data: PersonData[], images: Map<string, string>) => void;
  onError: (error: string) => void;
}

export const DataLoader: React.FC<DataLoaderProps> = ({ onDataLoad, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState<PersonData[] | null>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, string>>(new Map());
  
  const jsonFileRef = useRef<HTMLInputElement>(null);
  const imageFilesRef = useRef<HTMLInputElement>(null);

  const handleJsonFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
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
        onError('Invalid JSON format. Please check your file.');
      } else if (error instanceof Error) {
        onError(`Data validation failed: ${error.message}`);
      } else {
        onError('Failed to load JSON file.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFilesLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    try {
      const imageMap = await loadImages(files);
      setLoadedImages(imageMap);
      
      // If JSON data is already loaded, trigger onDataLoad
      if (loadedData) {
        onDataLoad(loadedData, imageMap);
      }
      
    } catch (error) {
      if (error instanceof Error) {
        onError(`Image loading failed: ${error.message}`);
      } else {
        onError('Failed to load image files.');
      }
    } finally {
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

  const loadImages = async (files: FileList): Promise<Map<string, string>> => {
    const imageMap = new Map<string, string>();
    const loadPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!validateImageFile(file)) {
        throw new Error(`Invalid image format for file "${file.name}". Supported formats: PNG, JPG, JPEG`);
      }

      const loadPromise = new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          imageMap.set(file.name, reader.result as string);
          resolve();
        };
        reader.onerror = () => reject(new Error(`Failed to read image file: ${file.name}`));
        reader.readAsDataURL(file);
      });

      loadPromises.push(loadPromise);
    }

    await Promise.all(loadPromises);
    return imageMap;
  };

  const clearData = () => {
    setLoadedData(null);
    setLoadedImages(new Map());
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