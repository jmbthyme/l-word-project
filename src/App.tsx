import { useState, useCallback, useEffect } from 'react';
import { DataLoader } from './components/DataLoader';
import { DocumentControls } from './components/DocumentControls';
import { PreviewPanel } from './components/PreviewPanel';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer, useToast } from './components/Toast';
import { PDFService } from './services/PDFService';
import { FontService } from './services/FontService';
import { PerformanceService } from './services/PerformanceService';
import { ErrorHandlingService, setupGlobalErrorHandling } from './services/ErrorHandlingService';
import type { PersonData, WordCloudConfig, AppState, WordCloudItem, ValidationError } from './types';

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
  const [wordCloudConfig, setWordCloudConfig] = useState<WordCloudConfig>({
    paperSize: 'A4',
    orientation: 'landscape'
  });

  // Services
  const [pdfService] = useState(() => new PDFService());
  const [fontService] = useState(() => new FontService());
  const [performanceService] = useState(() => PerformanceService.getInstance());
  const [errorService] = useState(() => ErrorHandlingService.getInstance());

  // Performance monitoring state
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // Toast notifications
  const { messages: toastMessages, addToast, removeToast } = useToast();

  // Setup global error handling
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

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
    
    // Show toast notification for data errors
    addToast({
      title: 'Data Loading Error',
      message: error,
      type: 'error',
      duration: 7000
    });
  }, [addToast]);

  // Handle validation errors from DataLoader component
  const handleValidationErrors = useCallback((errors: ValidationError[]) => {
    // Show detailed validation errors in toast
    const errorCount = errors.length;
    const summary = errorCount === 1 
      ? `Validation error in ${errors[0].field}: ${errors[0].message}`
      : `Found ${errorCount} validation errors. Please check your data format.`;
    
    addToast({
      title: 'Data Validation Failed',
      message: summary,
      type: 'error',
      duration: 10000
    });
  }, [addToast]);

  // Handle word cloud configuration changes
  const handleWordCloudConfigChange = useCallback((config: WordCloudConfig) => {
    setWordCloudConfig(config);
  }, []);

  // Generate Word Cloud PDF with performance monitoring and error handling
  const handleGenerateWordCloud = useCallback(async (config: WordCloudConfig) => {
    setWordCloudConfig(config);
    if (appState.data.length === 0) return;

    setIsGeneratingPDF(true);
    setAppState(prev => ({ ...prev, error: null }));

    const timer = performanceService.createTimer('Word Cloud Generation');

    try {
      // Monitor memory before starting
      performanceService.monitorMemoryUsage();

      // Extract words from data
      const words = appState.data.map(item => item.word);
      
      // Preload fonts for word cloud with retry mechanism
      const fonts = await errorService.withRetry(
        () => fontService.preloadFontsForWordCloud(words.length),
        2,
        1000,
        'Font Preloading for Word Cloud'
      );
      
      setAppState(prev => ({ ...prev, fonts }));

      // Show success toast for font loading
      if (fonts.length > 0) {
        addToast({
          title: 'Fonts Loaded',
          message: `Successfully loaded ${fonts.length} fonts for word cloud`,
          type: 'success',
          duration: 3000
        });
      }

      // Generate word cloud layout (this will be handled by WordCloudGenerator)
      // For now, we'll create a simple layout
      const wordCloudItems: WordCloudItem[] = words.map((word, index) => ({
        text: word,
        size: Math.max(12, 48 - (index * 2)), // Decreasing size
        weight: 400 + (Math.random() * 500), // Random weight between 400-900
        fontFamily: fonts[index % fonts.length]?.family || 'Arial',
        color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color
        x: Math.random() * 400 + 100, // Random position
        y: Math.random() * 300 + 100
      }));

      setWordCloudItems(wordCloudItems);
      setCurrentView('wordcloud');

      // Generate PDF with retry mechanism
      const pdfBlob = await errorService.withRetry(
        () => pdfService.generateWordCloudPDF(wordCloudItems, config),
        2,
        2000,
        'Word Cloud PDF Generation'
      );
      
      // Download PDF
      const filename = `word-cloud-${config.paperSize}-${config.orientation}-${new Date().toISOString().split('T')[0]}`;
      pdfService.downloadPDF(pdfBlob, filename);

      // Show success toast
      addToast({
        title: 'Word Cloud Generated',
        message: `Successfully generated ${config.paperSize} ${config.orientation} Word Cloud PDF`,
        type: 'success',
        duration: 5000
      });

    } catch (error) {
      console.error('Word Cloud generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setAppState(prev => ({
        ...prev,
        error: `Word Cloud generation failed: ${errorMessage}`
      }));
      
      // Handle error through error service
      errorService.handlePDFGenerationError('wordcloud', error instanceof Error ? error : new Error(String(error)));
      
    } finally {
      timer.stop();
      setIsGeneratingPDF(false);
    }
  }, [appState.data, fontService, pdfService, performanceService, errorService, addToast]);

  // Generate Dossier PDF with performance monitoring and error handling
  const handleGenerateDossier = useCallback(async () => {
    if (appState.data.length === 0) return;

    setIsGeneratingPDF(true);
    setAppState(prev => ({ ...prev, error: null }));
    setCurrentView('dossier');

    const timer = performanceService.createTimer('Dossier Generation');

    try {
      // Monitor memory before starting
      performanceService.monitorMemoryUsage();

      // Generate PDF with retry mechanism
      const pdfBlob = await errorService.withRetry(
        () => pdfService.generateDossierPDF(appState.data, appState.images),
        2,
        2000,
        'Dossier PDF Generation'
      );
      
      // Download PDF
      const filename = `dossier-${new Date().toISOString().split('T')[0]}`;
      pdfService.downloadPDF(pdfBlob, filename);

      // Show success toast
      addToast({
        title: 'Dossier Generated',
        message: `Successfully generated dossier PDF with ${appState.data.length} entries`,
        type: 'success',
        duration: 5000
      });

    } catch (error) {
      console.error('Dossier generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setAppState(prev => ({
        ...prev,
        error: `Dossier generation failed: ${errorMessage}`
      }));
      
      // Handle error through error service
      errorService.handlePDFGenerationError('dossier', error instanceof Error ? error : new Error(String(error)));
      
    } finally {
      timer.stop();
      setIsGeneratingPDF(false);
    }
  }, [appState.data, appState.images, pdfService, performanceService, errorService, addToast]);

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
              onValidationErrors={handleValidationErrors}
            />

            {/* Document Controls */}
            <DocumentControls
              data={appState.data}
              onGenerateWordCloud={handleGenerateWordCloud}
              onGenerateDossier={handleGenerateDossier}
              isGenerating={isGeneratingPDF}
              disabled={appState.isLoading}
              onConfigChange={handleWordCloudConfigChange}
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
            <PreviewPanel
              data={appState.data}
              images={appState.images}
              currentView={currentView}
              wordCloudConfig={wordCloudConfig}
              fonts={appState.fonts}
              wordCloudItems={wordCloudItems}
              isGenerating={isGeneratingPDF}
              onWordsGenerated={setWordCloudItems}
              onConfigChange={handleWordCloudConfigChange}
            />
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

      {/* Toast Notifications */}
      <ToastContainer
        messages={toastMessages}
        onClose={removeToast}
      />
    </div>
  );
}

// Wrap App with ErrorBoundary
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Application Error Boundary caught error:', error, errorInfo);
        // Could send to error reporting service here
      }}
    >
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
