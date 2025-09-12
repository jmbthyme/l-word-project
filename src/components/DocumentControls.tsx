import React, { useState } from 'react';
import type { PersonData, WordCloudConfig } from '../types';

export interface DocumentControlsProps {
  data: PersonData[];
  onGenerateWordCloudPreview: (config: WordCloudConfig) => void;
  onGenerateDossierPreview: () => void;
  onDownloadWordCloudPDF?: () => void;
  onDownloadDossierPDF?: () => void;
  isGeneratingPreview?: boolean;
  isDownloadingPDF?: boolean;
  disabled?: boolean;
  onConfigChange?: (config: WordCloudConfig) => void;
  currentView: 'none' | 'wordcloud' | 'dossier';
}

/**
 * DocumentControls component provides UI controls for document creation
 * Allows users to select paper size, orientation, and trigger document creation
 */
export const DocumentControls: React.FC<DocumentControlsProps> = ({
  data,
  onGenerateWordCloudPreview,
  onGenerateDossierPreview,
  onDownloadWordCloudPDF,
  onDownloadDossierPDF,
  isGeneratingPreview = false,
  isDownloadingPDF = false,
  disabled = false,
  onConfigChange,
  currentView
}) => {
  const [accordionOpen, setAccordionOpen] = useState<'wordcloud' | 'dossier' | null>(null);

  const [wordCloudConfig, setWordCloudConfig] = useState<WordCloudConfig>({
    paperSize: 'A4' as const,
    orientation: 'landscape' as const,
    colorScheme: 'color' as const,
    dpi: 300 as const,
    padding: 0 as const
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

  const handleDPIChange = (dpi: 300 | 600) => {
    const newConfig = { ...wordCloudConfig, dpi };
    setWordCloudConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handlePaddingChange = (padding: number) => {
    const newConfig = { ...wordCloudConfig, padding };
    setWordCloudConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleGenerateWordCloudPreview = () => {
    if (!disabled && !isGeneratingPreview && data.length > 0) {
      onGenerateWordCloudPreview(wordCloudConfig);
    }
  };

  const handleGenerateDossierPreview = () => {
    if (!disabled && !isGeneratingPreview && data.length > 0) {
      onGenerateDossierPreview();
    }
  };

  const handleDownloadWordCloudPDF = () => {
    if (onDownloadWordCloudPDF && !isDownloadingPDF) {
      onDownloadWordCloudPDF();
    }
  };

  const handleDownloadDossierPDF = () => {
    if (onDownloadDossierPDF && !isDownloadingPDF) {
      onDownloadDossierPDF();
    }
  };

  const isDisabled = disabled || isGeneratingPreview || data.length === 0;

  return (
    <div className="document-controls bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="controls-header">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Generate Content
        </h2>
        <p className="text-sm text-gray-600">
          {data.length === 0
            ? 'Load data to enable Word Cloud image and Dossier document creation'
            : `Ready to create Word Cloud image and Dossier document from ${data.length} items`
          }
        </p>
      </div>

      {/* Accordion Start */}
      <div className="space-y-4">

        {/* Word Cloud Accordion Item */}
        <div className="border rounded-lg">
          <button
            type="button"
            className="w-full flex justify-between items-center px-4 py-3 text-left text-lg font-medium text-gray-700 focus:outline-none"
            onClick={() => setAccordionOpen(accordionOpen === 'wordcloud' ? null : 'wordcloud')}
            aria-expanded={accordionOpen === 'wordcloud'}
            aria-controls="wordcloud-panel"
          >
            <h3 className="text-lg font-medium text-gray-700">
              Word Cloud Image
            </h3>
            <svg
              className={`w-5 h-5 transition-transform ${accordionOpen === 'wordcloud' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {accordionOpen === 'wordcloud' && (
            <div id="wordcloud-panel" className="p-4">
              {/* Word Cloud Controls */}
              <div className="word-cloud-controls space-y-4">
                <div className="section-header">
                  <p className="text-sm text-gray-500 mb-4">
                    Create a Word Cloud image using either default settings or customize the options to suit your preferences. 
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
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${wordCloudConfig.paperSize === 'A4'
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
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${wordCloudConfig.paperSize === 'A3'
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
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${wordCloudConfig.orientation === 'portrait'
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
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${wordCloudConfig.orientation === 'landscape'
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

                {/* Print Quality (DPI) Selection */}
                <div className="control-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Print Quality
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dpi"
                        value="300"
                        checked={wordCloudConfig.dpi.toString() === "300"}
                        onChange={() => handleDPIChange(300)}
                        disabled={isDisabled}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        <span className="font-medium">300 DPI</span> - Professional Standard
                        <div className="text-xs text-gray-500 ml-0">Perfect for business, marketing, posters (~25MB)</div>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dpi"
                        value="600"
                        checked={wordCloudConfig.dpi.toString() === "600"}
                        onChange={() => handleDPIChange(600)}
                        disabled={isDisabled}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        <span className="font-medium">600 DPI</span> - Ultra High-End
                        <div className="text-xs text-gray-500 ml-0">For fine art, museum quality, luxury prints (~100MB)</div>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Padding Control */}
                <div className="control-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Padding
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={wordCloudConfig.padding}
                    onChange={(e) => handlePaddingChange(Number(e.target.value))}
                    disabled={isDisabled}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600">
                    {wordCloudConfig.padding}px
                  </span>
                </div>

                {/* Generate Word Cloud Preview Button */}
                <button
                  onClick={handleGenerateWordCloudPreview}
                  disabled={isDisabled}
                  className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${isDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                >
                  {isGeneratingPreview ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Preview...
                    </span>
                  ) : (
                    'Create Word Cloud Preview'
                  )}
                </button>

                {/* Download Word Cloud PDF Button */}
                {currentView === 'wordcloud' && onDownloadWordCloudPDF && (
                  <button
                    onClick={handleDownloadWordCloudPDF}
                    disabled={isDownloadingPDF}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${isDownloadingPDF
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                      }`}
                  >
                    {isDownloadingPDF ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading PDF...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Word Cloud Image
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dossier Accordion Item */}
        <div className="border rounded-lg">
          <button
            type="button"
            className="w-full flex justify-between items-center px-4 py-3 text-left text-lg font-medium text-gray-700 focus:outline-none"
            onClick={() => setAccordionOpen(accordionOpen === 'dossier' ? null : 'dossier')}
            aria-expanded={accordionOpen === 'dossier'}
            aria-controls="dossier-panel"
          >
            <h3 className="text-lg font-medium text-gray-700">
              Dossier Document
            </h3>
            <svg
              className={`w-5 h-5 transition-transform ${accordionOpen === 'dossier' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {accordionOpen === 'dossier' && (
            <div id="dossier-panel" className="p-4">
              {/* Dossier Controls */}
              <div className="dossier-controls space-y-4">
                <div className="section-header">
                  <p className="text-sm text-gray-500 mb-4">
                    Create a comprehensive document with all data. A4 Portrait (8.3" × 11.7").
                  </p>
                </div>

                {/* Generate Dossier Preview Button */}
                <button
                  onClick={handleGenerateDossierPreview}
                  disabled={isDisabled}
                  className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${isDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                    }`}
                >
                  {isGeneratingPreview ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Preview...
                    </span>
                  ) : (
                    'Create Dossier Preview'
                  )}
                </button>

                {/* Download Dossier PDF Button */}
                {currentView === 'dossier' && onDownloadDossierPDF && (
                  <button
                    onClick={handleDownloadDossierPDF}
                    disabled={isDownloadingPDF}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${isDownloadingPDF
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      }`}
                  >
                    {isDownloadingPDF ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading PDF...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Dossier PDF
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};