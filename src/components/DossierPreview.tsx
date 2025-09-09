import React from 'react';
import type { PersonData } from '../types';

interface DossierPreviewProps {
  data: PersonData[];
  images: Map<string, string>;
  className?: string;
}

/**
 * DossierPreview provides a visual preview of how the Dossier PDF will look
 * This helps users verify the layout before generating the actual PDF
 */
export const DossierPreview: React.FC<DossierPreviewProps> = ({ 
  data, 
  images, 
  className = '' 
}) => {
  const ITEMS_PER_PAGE = 2;
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  // Split data into pages
  const getPageData = (pageIndex: number): PersonData[] => {
    const startIndex = pageIndex * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, data.length);
    return data.slice(startIndex, endIndex);
  };

  // Render a single person item
  const renderPersonItem = (person: PersonData, index: number) => {
    const imageData = images.get(person.picture);
    
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
            
            {/* Description Section */}
            <div className="mb-3">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Description:</span>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed text-justify">
                {person.description}
              </p>
            </div>
          </div>
          
          {/* Right Column - Image */}
          {imageData && (
            <div className="w-24 h-24 flex-shrink-0">
              <img
                src={imageData}
                alt={`Picture of ${person.person}`}
                className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
              />
            </div>
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
        <p>No data to preview. Please load data first.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Dossier Preview</h2>
        <p className="text-sm text-gray-600">
          Preview of {data.length} entries across {totalPages} page{totalPages !== 1 ? 's' : ''} (A4 Portrait)
        </p>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Array.from({ length: totalPages }, (_, pageIndex) => renderPage(pageIndex))}
      </div>
    </div>
  );
};

export default DossierPreview;