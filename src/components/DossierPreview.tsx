import React, { useState, useEffect } from 'react';
import type { PersonData } from '../types';

interface DossierPreviewProps {
  data: PersonData[];
  images: Map<string, string>;
  className?: string;
  isGenerating?: boolean;
  onPreviewReady?: () => void;
}

/**
 * DossierPreview provides a visual preview of how the Dossier PDF will look
 * This helps users verify the layout before generating the actual PDF
 * Enhanced with visual feedback and accurate print representation
 */
export const DossierPreview: React.FC<DossierPreviewProps> = ({ 
  data, 
  images, 
  className = '',
  isGenerating = false,
  onPreviewReady
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const ITEMS_PER_PAGE = 2;
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  // Track image loading for preview readiness
  useEffect(() => {
    const totalImages = data.filter(person => person.picture && images.has(person.picture)).length;
    if (totalImages === 0) {
      setIsLoading(false);
      onPreviewReady?.();
    } else if (imagesLoaded >= totalImages) {
      setIsLoading(false);
      onPreviewReady?.();
    }
  }, [imagesLoaded, data, images, onPreviewReady]);

  // Handle image load events
  const handleImageLoad = () => {
    setImagesLoaded(prev => prev + 1);
  };

  const handleImageError = (personName: string) => {
    console.warn(`Failed to load image for ${personName}`);
    setImagesLoaded(prev => prev + 1);
  };

  // Split data into pages
  const getPageData = (pageIndex: number): PersonData[] => {
    const startIndex = pageIndex * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, data.length);
    return data.slice(startIndex, endIndex);
  };

  // Render a single person item
  const renderPersonItem = (person: PersonData, index: number) => {
    const imageData = person.picture ? images.get(person.picture) : undefined;
    
    return (
      <div key={`person-${index}`} className="mb-6 pb-4 border-b border-gray-200 last:border-b-0">
        {/* Person Name Header */}
        <h3 className="text-lg font-bold text-blue-600 mb-3">{person.person}</h3>
        
        {/* Content Container */}
        <div className="flex items-start gap-5">
          {/* Left Column - Text Content */}
          <div className="flex-1">
            {/* Word Section */}
            <div className="mb-3">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Word:</span>
              <div className="mt-1 text-base font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                {person.word}
              </div>
            </div>
            
            {/* Description Section - Only render if description exists */}
            {person.description && (
              <div className="mb-3">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Description:</span>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed text-justify">
                  {person.description}
                </p>
              </div>
            )}
          </div>
          
          {/* Right Column - Image - Only render if picture field exists */}
          {person.picture && (
            <>
              {imageData ? (
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={imageData}
                    alt={`Picture of ${person.person}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                    onLoad={handleImageLoad}
                    onError={() => handleImageError(person.person)}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Render a single page
  const renderPage = (pageIndex: number) => {
    const pageData = getPageData(pageIndex);
    
    return (
      <div key={`page-${pageIndex}`} className="bg-white border border-gray-300 shadow-sm mb-4 last:mb-0">
        {/* Page Container - A4 aspect ratio simulation */}
        <div className="w-full" style={{ aspectRatio: '210/297' }}>
          <div className="h-full p-6 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-800">
              <h2 className="text-xl font-bold text-gray-800">Dossier</h2>
              <span className="text-xs text-gray-500">
                Page {pageIndex + 1} of {totalPages}
              </span>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {pageData.map((person, index) => 
                renderPersonItem(person, pageIndex * ITEMS_PER_PAGE + index)
              )}
            </div>
            
            {/* Footer */}
            <div className="mt-4 pt-2 border-t border-gray-200 text-center">
              <span className="text-xs text-gray-400">
                Generated on {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p>No data to preview. Please load data first.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Dossier Preview</h2>
            <p className="text-sm text-gray-600">
              Preview of {data.length} entries across {totalPages} page{totalPages !== 1 ? 's' : ''} (A4 Portrait)
            </p>
          </div>
          
          {/* Visual feedback indicators */}
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="flex items-center text-sm text-blue-600">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading preview...
              </div>
            )}
            
            {isGenerating && (
              <div className="flex items-center text-sm text-green-600">
                <svg className="animate-pulse mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Generating PDF...
              </div>
            )}
            
            {!isLoading && !isGenerating && (
              <div className="flex items-center text-sm text-green-600">
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Preview ready
              </div>
            )}
          </div>
        </div>
        
        {/* Print accuracy indicator */}
        <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block">
          📄 Print-accurate preview at 1:4 scale • Actual size: 8.3" × 11.7"
        </div>
      </div>
      
      <div className={`space-y-4 max-h-96 overflow-y-auto ${isLoading ? 'opacity-50' : ''}`}>
        {Array.from({ length: totalPages }, (_, pageIndex) => renderPage(pageIndex))}
      </div>
    </div>
  );
};

export default DossierPreview;