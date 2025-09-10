import React, { useState } from 'react';
import type { PersonData, WordCloudConfig } from '../types';

export interface DocumentControlsProps {
  data: PersonData[];
  onGenerateWordCloud: (config: WordCloudConfig) => void;
  onGenerateDossier: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  onConfigChange?: (config: WordCloudConfig) => void;
}

/**
 * DocumentControls component provides UI controls for PDF generation
 * Allows users to select paper size, orientation, and trigger document generation
 */
export const DocumentControls: React.FC<DocumentControlsProps> = ({
  data,
  onGenerateWordCloud,
  onGenerateDossier,
  isGenerating = false,
  disabled = false,
  onConfigChange
}) => {
  const [wordCloudConfig, setWordCloudConfig] = useState<WordCloudConfig>({
    paperSize: 'A4',
    orientation: 'landscape',
    colorScheme: 'color'
  });

  const handlePaperSizeChange = (paperSize: 'A4' | 'A3') => {
    const newConfig = { ...wordCloudConfig, paperSize };
    setWordCloudConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
    const newConfig = { ...wordCloudConfig, orientation };
    setWordCloudConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleColorSchemeChange = (colorScheme: 'color' | 'grayscale' | 'black') => {
    const newConfig = { ...wordCloudConfig, colorScheme };
    setWordCloudConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleGenerateWordCloud = () => {
    if (!disabled && !isGenerating && data.length > 0) {
      onGenerateWordCloud(wordCloudConfig);
    }
  };

  const handleGenerateDossier = () => {
    if (!disabled && !isGenerating && data.length > 0) {
      onGenerateDossier();
    }
  };

  const isDisabled = disabled || isGenerating || data.length === 0;

  return (
    <div className="document-controls bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="controls-header">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Document Generation
        </h2>
        <p className="text-sm text-gray-600">
          {data.length === 0 
            ? 'Load data to enable document generation'
            : `Ready to generate documents from ${data.length} items`
          }
        </p>
      </div>

      {/* Word Cloud Controls */}
      <div className="word-cloud-controls border rounded-lg p-4 space-y-4">
        <div className="section-header">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Word Cloud PDF
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Generate a visual word cloud with varied fonts and sizes
          </p>
        </div>

        {/* Paper Size Selection */}
        <div className="control-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paper Size
          </label>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => handlePaperSizeChange('A4')}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                wordCloudConfig.paperSize === 'A4'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              A4 (8.3" × 11.7")
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('A3')}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                wordCloudConfig.paperSize === 'A3'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              A3 (11.7" × 16.5")
            </button>
          </div>
        </div>

        {/* Orientation Selection */}
        <div className="control-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Orientation
          </label>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => handleOrientationChange('portrait')}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                wordCloudConfig.orientation === 'portrait'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              Portrait
            </button>
            <button
              type="button"
              onClick={() => handleOrientationChange('landscape')}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                wordCloudConfig.orientation === 'landscape'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              Landscape
            </button>
          </div>
        </div>

        {/* Color Scheme Selection */}
        <div className="control-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Scheme
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="colorScheme"
                value="color"
                checked={wordCloudConfig.colorScheme === 'color'}
                onChange={() => handleColorSchemeChange('color')}
                disabled={isDisabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center">
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mr-2"></span>
                Color
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="colorScheme"
                value="grayscale"
                checked={wordCloudConfig.colorScheme === 'grayscale'}
                onChange={() => handleColorSchemeChange('grayscale')}
                disabled={isDisabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center">
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 mr-2"></span>
                Grayscale
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="colorScheme"
                value="black"
                checked={wordCloudConfig.colorScheme === 'black'}
                onChange={() => handleColorSchemeChange('black')}
                disabled={isDisabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center">
                <span className="w-4 h-4 rounded-full bg-black mr-2"></span>
                Black
              </span>
            </label>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="config-summary bg-gray-50 rounded-md p-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Selected:</span> {wordCloudConfig.paperSize} {wordCloudConfig.orientation}, {wordCloudConfig.colorScheme}
            {wordCloudConfig.paperSize === 'A4' && wordCloudConfig.orientation === 'landscape' && 
              ' (11.7" × 8.3")'
            }
            {wordCloudConfig.paperSize === 'A4' && wordCloudConfig.orientation === 'portrait' && 
              ' (8.3" × 11.7")'
            }
            {wordCloudConfig.paperSize === 'A3' && wordCloudConfig.orientation === 'landscape' && 
              ' (16.5" × 11.7")'
            }
            {wordCloudConfig.paperSize === 'A3' && wordCloudConfig.orientation === 'portrait' && 
              ' (11.7" × 16.5")'
            }
          </p>
        </div>

        {/* Generate Word Cloud Button */}
        <button
          onClick={handleGenerateWordCloud}
          disabled={isDisabled}
          className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
            isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Word Cloud PDF...
            </span>
          ) : (
            'Generate Word Cloud PDF'
          )}
        </button>
      </div>

      {/* Dossier Controls */}
      <div className="dossier-controls border rounded-lg p-4 space-y-4">
        <div className="section-header">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Dossier PDF
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Generate a comprehensive document with all data (A4 Portrait)
          </p>
        </div>

        {/* Dossier Configuration Info */}
        <div className="config-info bg-gray-50 rounded-md p-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Format:</span> A4 Portrait (8.3" × 11.7")
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Content:</span> Person, word, description, and images
          </p>
        </div>

        {/* Generate Dossier Button */}
        <button
          onClick={handleGenerateDossier}
          disabled={isDisabled}
          className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
            isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Dossier PDF...
            </span>
          ) : (
            'Generate Dossier PDF'
          )}
        </button>
      </div>

      {/* Data Summary */}
      {data.length > 0 && (
        <div className="data-summary bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Data Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Total Items:</span>
              <span className="ml-2 text-blue-800">{data.length}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Unique Words:</span>
              <span className="ml-2 text-blue-800">
                {new Set(data.map(item => item.word.toLowerCase())).size}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};