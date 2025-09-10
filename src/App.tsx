import { useState, useCallback } from 'react';
import { DataLoader } from './components/DataLoader';
import { DocumentControls } from './components/DocumentControls';
import { DossierPreview } from './components/DossierPreview';
import { WordCloudGenerator } from './components/WordCloudGenerator';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { PDFService } from './services/PDFService';
import { FontService } from './services/FontService';
import { PerformanceService } from './services/PerformanceService';
import type { PersonData, WordCloudConfig, AppState, WordCloudItem } from './types';

function App() {
  // Application state
  const [appState, setAppState] = useState<AppState>({
    data: [],
    images: new Map(),
    isLoading: false,
    error: null,
    fonts: []
  });

  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentView, setCurrentView] = useState<'none' | 'wordcloud' | 'dossier'>('none');
  const [wordCloudItems, setWordCloudItems] = useState<WordCloudItem[]>([]);

  // Services
  const [pdfService] = useState(() => new PDFService());
  const [fontService] = useState(() => new FontService());
  const [performanceService] = useState(() => PerformanceService.getInstance());

  // Performance monitoring state
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // Handle data loading from DataLoader component
  const handleDataLoad = useCallback((data: PersonData[], images: Map<string, string>) => {
    setAppState(prev => ({
      ...prev,
      data,
      images,
      error: null
    }));
    setCurrentView('none');
  }, []);

  // Handle errors from DataLoader component
  const handleDataError = useCallback((error: string) => {
    setAppState(prev => ({
      ...prev,
      error,
      data: [],
      images: new Map()
    }));
    setCurrentView('none');
  }, []);

  // Generate Word Cloud PDF with performance monitoring
  const handleGenerateWordCloud = useCallback(async (config: WordCloudConfig) => {
    if (appState.data.length === 0) return;

    setIsGeneratingPDF(true);
    setAppState(prev => ({ ...prev, error: null }));

    const timer = performanceService.createTimer('Word Cloud Generation');

    try {
      // Monitor memory before starting
      performanceService.monitorMemoryUsage();

      // Extract words from data
      const words = appState.data.map(item => item.word);
      
      // Preload fonts for word cloud with performance optimization
      const fonts = await fontService.preloadFontsForWordCloud(words.length);
      setAppState(prev => ({ ...prev, fonts }));

      // Generate word cloud layout (this will be handled by WordCloudGenerator)
      // For now, we'll create a simple layout
      const wordCloudItems: WordCloudItem[] = words.map((word, index) => ({
        text: word,
        size: Math.max(12, 48 - (index * 2)), // Decreasing size
        weight: 400 + (Math.random() * 500), // Random weight between 400-900
        fontFamily: fonts[index % fonts.length]?.family || 'Roboto',
        color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color
        x: Math.random() * 400 + 100, // Random position
        y: Math.random() * 300 + 100
      }));

      setWordCloudItems(wordCloudItems);
      setCurrentView('wordcloud');

      // Generate PDF with performance optimizations
      const pdfBlob = await pdfService.generateWordCloudPDF(wordCloudItems, config);
      
      // Download PDF
      const filename = `word-cloud-${config.paperSize}-${config.orientation}-${new Date().toISOString().split('T')[0]}`;
      pdfService.downloadPDF(pdfBlob, filename);

    } catch (error) {
      console.error('Word Cloud generation failed:', error);
      setAppState(prev => ({
        ...prev,
        error: `Word Cloud generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    } finally {
      timer.stop();
      setIsGeneratingPDF(false);
    }
  }, [appState.data, fontService, pdfService, performanceService]);

  // Generate Dossier PDF with performance monitoring
  const handleGenerateDossier = useCallback(async () => {
    if (appState.data.length === 0) return;

    setIsGeneratingPDF(true);
    setAppState(prev => ({ ...prev, error: null }));
    setCurrentView('dossier');

    const timer = performanceService.createTimer('Dossier Generation');

    try {
      // Monitor memory before starting
      performanceService.monitorMemoryUsage();

      // Generate PDF with performance optimizations
      const pdfBlob = await pdfService.generateDossierPDF(appState.data, appState.images);
      
      // Download PDF
      const filename = `dossier-${new Date().toISOString().split('T')[0]}`;
      pdfService.downloadPDF(pdfBlob, filename);

    } catch (error) {
      console.error('Dossier generation failed:', error);
      setAppState(prev => ({
        ...prev,
        error: `Dossier generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    } finally {
      timer.stop();
      setIsGeneratingPDF(false);
    }
  }, [appState.data, appState.images, pdfService, performanceService]);

  // Clear error message
  const clearError = useCallback(() => {
    setAppState(prev => ({ ...prev, error: null }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            PDF Document Generator
          </h1>
          <p className="text-lg text-gray-600">
            Generate Word Cloud and Dossier PDFs from your data
          </p>
        </header>

        {/* Error Display */}
        {appState.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{appState.error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearError}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Data Loading and Controls */}
          <div className="space-y-6">
            {/* Data Loader */}
            <DataLoader
              onDataLoad={handleDataLoad}
              onError={handleDataError}
            />

            {/* Document Controls */}
            <DocumentControls
              data={appState.data}
              onGenerateWordCloud={handleGenerateWordCloud}
              onGenerateDossier={handleGenerateDossier}
              isGenerating={isGeneratingPDF}
              disabled={appState.isLoading}
            />

            {/* Loading State */}
            {(appState.isLoading || isGeneratingPDF) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">
                      {appState.isLoading ? 'Loading data...' : 'Generating PDF...'}
                    </p>
                    <p className="text-sm text-blue-600">
                      {isGeneratingPDF ? 'This may take a few moments.' : 'Please wait.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            {currentView === 'none' && appState.data.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
            )}

            {currentView === 'none' && appState.data.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Data Ready</h3>
                <p className="text-gray-600 mb-4">
                  {appState.data.length} items loaded. Choose a document type to generate.
                </p>
                <div className="text-sm text-gray-500">
                  <p>• Word Cloud: Visual representation of words</p>
                  <p>• Dossier: Comprehensive document with all data</p>
                </div>
              </div>
            )}

            {currentView === 'wordcloud' && wordCloudItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Word Cloud Preview</h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-64 flex items-center justify-center">
                  <WordCloudGenerator
                    data={appState.data}
                    config={{ paperSize: 'A4', orientation: 'landscape' }}
                    fonts={appState.fonts}
                    onWordsGenerated={setWordCloudItems}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Preview of {wordCloudItems.length} words with varied fonts and sizes
                </p>
              </div>
            )}

            {currentView === 'dossier' && appState.data.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <DossierPreview
                  data={appState.data}
                  images={appState.images}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>PDF Document Generator - Generate professional Word Cloud and Dossier documents</p>
        </footer>
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor
        isVisible={showPerformanceMonitor}
        onToggle={setShowPerformanceMonitor}
      />
    </div>
  );
}

export default App;
