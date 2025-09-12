import React, { useState } from 'react';
import { DocumentControls } from '../components/DocumentControls';
import { WordCloudGenerator } from '../components/WordCloudGenerator';
import { PDFService } from '../services/PDFService';
import { FontService } from '../services/FontService';
import type { PersonData, WordCloudConfig, WordCloudItem } from '../types';

/**
 * Example component demonstrating PDF generation functionality
 * This shows how to integrate the DocumentControls, WordCloudGenerator, and PDFService
 */
export const PDFGenerationExample: React.FC = () => {
  const [data] = useState<PersonData[]>([
    {
      person: 'Alice Johnson',
      word: 'Innovation',
      description: 'A creative problem solver who brings fresh perspectives',
      picture: 'alice.jpg'
    },
    {
      person: 'Bob Smith',
      word: 'Leadership',
      description: 'Natural leader who inspires and motivates teams',
      picture: 'bob.jpg'
    },
    {
      person: 'Carol Davis',
      word: 'Creativity'
      // No description or picture - demonstrating optional fields
    },
    {
      person: 'David Wilson',
      word: 'Innovation',
      description: 'Forward-thinking approach to complex challenges'
      // No picture - demonstrating optional picture field
    },
    {
      person: 'Eva Martinez',
      word: 'Collaboration',
      picture: 'eva.jpg'
      // No description - demonstrating optional description field
    }
  ]);

  const [fonts, setFonts] = useState<any[]>([]);
  const [wordCloudItems, setWordCloudItems] = useState<WordCloudItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fontService = new FontService();
  const pdfService = new PDFService();

  // Load fonts when component mounts
  React.useEffect(() => {
    const loadFonts = async () => {
      try {
        const loadedFonts = await fontService.preloadFontsForWordCloud(data.length);
        setFonts(loadedFonts);
      } catch (error) {
        console.error('Failed to load fonts:', error);
        // Use fallback fonts
        setFonts([
          { family: 'Arial', weights: [400, 700] },
          { family: 'Georgia', weights: [400, 700] },
          { family: 'Times New Roman', weights: [400, 700] }
        ]);
      }
    };

    loadFonts();
  }, [data.length]);

  const handleGenerateWordCloud = async (config: WordCloudConfig) => {
    if (wordCloudItems.length === 0) {
      alert('Please wait for the word cloud to generate first');
      return;
    }

    setIsGenerating(true);
    try {
      // Scale the word cloud items for PDF
      const scaledItems = pdfService.scaleWordCloudForPDF(wordCloudItems, config);
      
      // Generate PDF
      const pdfBlob = await pdfService.generateWordCloudPDF(scaledItems, config);
      
      // Download the PDF
      const filename = `word-cloud-${config.paperSize}-${config.orientation}`;
      pdfService.downloadPDF(pdfBlob, filename);
      
      alert('Word Cloud PDF generated successfully!');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDossier = () => {
    alert('Dossier generation will be implemented in a future task');
  };

  const handleWordsGenerated = (words: WordCloudItem[]) => {
    setWordCloudItems(words);
  };

  return (
    <div className="pdf-generation-example p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        PDF Generation Example
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Word Cloud Preview */}
        <div className="word-cloud-preview">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Word Cloud Preview
          </h2>
          <div className="border rounded-lg p-4 bg-gray-50 h-96">
            {fonts.length > 0 ? (
              <WordCloudGenerator
                data={data}
                config={{ paperSize: 'A4', orientation: 'landscape', colorScheme: 'color', dpi: 300, padding: 0 }}
                fonts={fonts}
                onWordsGenerated={handleWordsGenerated}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading fonts...
              </div>
            )}
          </div>
        </div>

        {/* Document Controls */}
        <div className="document-controls-section">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            PDF Generation Controls
          </h2>
          <DocumentControls
            data={data}
            onGenerateWordCloudPreview={handleGenerateWordCloud}
            onGenerateDossierPreview={handleGenerateDossier}
            currentView="none"
            isGeneratingPreview={isGenerating}
          />
        </div>
      </div>

      {/* Data Preview */}
      <div className="data-preview mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Sample Data
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="text-sm text-gray-600 overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          How to Use
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Wait for the word cloud preview to load (fonts need to be loaded first)</li>
          <li>Select your preferred paper size (A4 or A3) and orientation</li>
          <li>Click "Generate Word Cloud PDF" to create and download the PDF</li>
          <li>The PDF will be optimized for printing at the selected size</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p className="text-sm text-blue-600">
            <strong>Note:</strong> This example uses sample data. In a real application, 
            you would load data from JSON files and images using the DataLoader component.
          </p>
        </div>
      </div>
    </div>
  );
};