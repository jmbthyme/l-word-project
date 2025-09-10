// Core data types for PDF Document Generator
// Re-export validation types for convenience
export type {
  PersonData,
  WordCloudConfig,
  PDFConfig,
  GoogleFont,
  WordCloudItem
} from '../validation/schemas';

// Import types for use in interfaces
import type { PersonData, GoogleFont } from '../validation/schemas';

export interface AppState {
  data: PersonData[];
  images: Map<string, string>;
  isLoading: boolean;
  error: string | null;
  fonts: GoogleFont[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// Additional utility types
export interface PerformanceConfig {
  maxImageSize: number; // bytes
  maxDatasetSize: number; // number of items
  fontCacheSize: number;
  pdfChunkSize: number;
}

export interface ErrorHandler {
  handleDataFolderError(error: Error): void;
  handleDataValidationError(error: ValidationError): void;
  handleImageReferenceError(filename: string, error: Error): void;
  handleImageLoadError(filename: string, error: Error): void;
  handlePDFGenerationError(type: 'wordcloud' | 'dossier', error: Error): void;
  handleFontLoadError(fontFamily: string, error: Error): void;
}