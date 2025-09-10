import React, { useState, useEffect, useCallback } from 'react';
import { DossierPreview } from './DossierPreview';
import { WordCloudGenerator } from './WordCloudGenerator';
import type { PersonData, WordCloudConfig, GoogleFont, WordCloudItem } from '../types';

interface PreviewPanelProps {
  data: PersonData[];
  images: Map<string, string>;
  currentView: 'none' | 'wordcloud' | 'dossier';
  wordCloudConfig: WordCloudConfig;
  fonts: GoogleFont[];
  wordCloudItems: WordCloudItem[];
  isGenerating: boolean;
  onWordsGenerated?: (words: WordCloudItem[]) => void;
  onConfigChange?: (config: WordCloudConfig) => void;
}

/**
 * PreviewPanel provides enhanced preview functionality with visual feedback
 * and accurate print representation for both Word Cloud and Dossier documents
 */
export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  data,
  images,
  currentView,
  wordCloudConfig,
  fonts,
  wordCloudItems,
  isGenerating,
  onWordsGenerated,
  onConfigChange
}) => {
  const [previewReady, setPreviewReady] = useState(false);
  const [lastConfigChange, setLastConfigChange] = useState<number>(0);

  // Track configuration changes for preview updates
  useEffect(() => {
    setLastConfigChange(Date.now());
    setPreviewReady(false);
  }, [wordCloudConfig]);

  // Handle preview ready callback
  const handlePreviewReady = useCallback(() => {
    setPreviewReady(true);
  }, []);

  // Render empty state when no data
  if (data.length === 0) {
    return (
      <div className="preview-panel bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Loaded</h3>
        <p className="text-gray-600">
          Load your JSON data and images to get started with document generation.
        </p>
      </div>
    );
  }

  // Render ready state when data is loaded but no view selected
  if (currentView === 'none') {
    return (
      <div className="preview-panel bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Data Ready</h3>
        <p className="text-gray-600 mb-4">
          {data.length} items loaded. Choose a document type to generate.
        </p>
        <div className="text-sm text-gray-500 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
            </svg>
            <span>Word Cloud: Visual representation of words</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Dossier: Comprehensive document with all data</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Word Cloud preview
  if (currentView === 'wordcloud') {
    return (
      <div className="preview-panel bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Word Cloud Preview</h3>
            <p className="text-sm text-gray-600">
              Interactive preview with {data.length} words
            </p>
          </div>
          
          {/* Configuration change indicator */}
          {!previewReady && Date.now() - lastConfigChange < 2000 && (
            <div className="flex items-center text-sm text-blue-600">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating preview...
            </div>
          )}
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-64 relative">
          <WordCloudGenerator
            data={data}
            config={wordCloudConfig}
            fonts={fonts}
            onWordsGenerated={onWordsGenerated}
            isGenerating={isGenerating}
            onPreviewReady={handlePreviewReady}
          />
        </div>
        
        {/* Preview accuracy info */}
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
          <div className="flex items-center justify-between">
            <span>
              📄 Print-accurate preview • Actual size: {
                wordCloudConfig.paperSize === 'A4' && wordCloudConfig.orientation === 'landscape' ? '11.7" × 8.3"' :
                wordCloudConfig.paperSize === 'A4' && wordCloudConfig.orientation === 'portrait' ? '8.3" × 11.7"' :
                wordCloudConfig.paperSize === 'A3' && wordCloudConfig.orientation === 'landscape' ? '16.5" × 11.7"' :
                '11.7" × 16.5"'
              }
            </span>
            {previewReady && (
              <span className="text-green-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Ready
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Dossier preview
  if (currentView === 'dossier') {
    return (
      <div className="preview-panel bg-white rounded-lg shadow-md p-6">
        <DossierPreview
          data={data}
          images={images}
          isGenerating={isGenerating}
          onPreviewReady={handlePreviewReady}
        />
      </div>
    );
  }

  return null;
};

export default PreviewPanel;