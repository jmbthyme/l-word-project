# Design Document

## Overview

The PDF Document Generator is a React-based application that creates two distinct PDF outputs from JSON data: a Word Cloud and a Dossier. The application uses a component-based architecture with separate modules for data processing, document generation, and PDF export functionality.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Layer    │    │  Business Logic │    │   View Layer    │
│                 │    │                 │    │                 │
│ • JSON Loader   │───▶│ • Data Processor│───▶│ • Word Cloud    │
│ • Image Loader  │    │ • PDF Generator │    │ • Dossier       │
│ • Validator     │    │ • Font Manager  │    │ • Controls      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PDF Export    │
                       │                 │
                       │ • react-pdf     │
                       │ • Print Config  │
                       └─────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **PDF Generation**: @react-pdf/renderer
- **Word Cloud**: Custom implementation using D3.js or wordcloud2.js
- **Font Loading**: Google Fonts API
- **File Handling**: HTML5 File API

## Components and Interfaces

### Core Components

#### 1. App Component
- Main application container
- Manages global state for loaded data
- Coordinates between data loading and document generation

#### 2. DataLoader Component
```typescript
interface DataLoaderProps {
  onDataLoad: (data: PersonData[], images: Map<string, string>) => void;
  onError: (error: string) => void;
}

interface PersonData {
  person: string;
  word: string;
  description?: string;
  picture?: string;
}
```

#### 3. DocumentControls Component
```typescript
interface DocumentControlsProps {
  data: PersonData[];
  onGenerateWordCloud: (config: WordCloudConfig) => void;
  onGenerateDossier: () => void;
}

interface WordCloudConfig {
  paperSize: 'A4' | 'A3';
  orientation: 'portrait' | 'landscape';
}
```

#### 4. WordCloudGenerator Component
```typescript
interface WordCloudGeneratorProps {
  words: string[];
  config: WordCloudConfig;
  fonts: GoogleFont[];
}

interface GoogleFont {
  family: string;
  weights: number[];
}
```

#### 5. DossierGenerator Component
```typescript
interface DossierGeneratorProps {
  data: PersonData[];
  images: Map<string, string>; // filename -> base64
}
```

### Service Interfaces

#### DataService
```typescript
class DataService {
  loadDataFolder(folderHandle: FileSystemDirectoryHandle): Promise<{data: PersonData[], images: Map<string, string>}>;
  validateJsonData(data: any[]): PersonData[];
  validateImageReferences(data: PersonData[], availableImages: string[]): ValidationResult;
  processWordsForCloud(data: PersonData[]): WordCloudItem[];
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

interface WordCloudItem {
  text: string;
  size: number;
  weight: number;
  fontFamily: string;
}
```

#### PDFService
```typescript
class PDFService {
  generateWordCloudPDF(items: WordCloudItem[], config: WordCloudConfig): Promise<Blob>;
  generateDossierPDF(data: PersonData[], images: Map<string, string>): Promise<Blob>;
  downloadPDF(blob: Blob, filename: string): void;
}
```

#### FontService
```typescript
class FontService {
  loadGoogleFonts(families: string[]): Promise<void>;
  getRandomFontCombination(): GoogleFont[];
  preloadFontsForWordCloud(wordCount: number): Promise<GoogleFont[]>;
}
```

## Data Models

### Core Data Types

```typescript
// Input data structure
interface PersonData {
  person: string;
  word: string;
  description?: string; // optional field
  picture?: string; // optional filename reference
}

// Word cloud processing
interface WordCloudItem {
  text: string;
  size: number; // calculated based on frequency/importance
  weight: number; // font weight (100-900)
  fontFamily: string;
  color?: string;
  x?: number;
  y?: number;
}

// PDF configuration
interface PDFConfig {
  paperSize: 'A4' | 'A3';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Application state
interface AppState {
  data: PersonData[];
  images: Map<string, string>;
  isLoading: boolean;
  error: string | null;
  fonts: GoogleFont[];
}
```

## Error Handling

### Validation Strategy

1. **Data Folder Validation**
   - Verify folder contains at least one JSON file
   - Validate folder structure and file accessibility
   - Check for supported image formats in the same folder

2. **JSON Data Validation**
   - Schema validation using Zod or similar
   - Required field checking (person, word)
   - Optional field validation (description, picture)
   - Data type validation
   - Graceful error reporting

3. **Image Reference Validation**
   - Verify picture field references exist as files in the data folder
   - File format validation (PNG, JPG, JPEG)
   - File size limits
   - Missing image handling with warnings
   - Base64 conversion error handling

3. **PDF Generation**
   - Memory management for large datasets
   - Font loading failures
   - Export process errors
   - Browser compatibility issues

### Error Recovery

```typescript
interface ErrorHandler {
  handleDataFolderError(error: Error): void;
  handleDataValidationError(error: ValidationError): void;
  handleImageReferenceError(filename: string, error: Error): void;
  handleImageLoadError(filename: string, error: Error): void;
  handlePDFGenerationError(type: 'wordcloud' | 'dossier', error: Error): void;
  handleFontLoadError(fontFamily: string, error: Error): void;
}
```

## Testing Strategy

### Unit Testing
- Data validation functions
- PDF generation utilities
- Font loading and management
- Word cloud algorithm

### Integration Testing
- Complete data loading workflow
- PDF generation end-to-end
- Font integration with PDF output
- Image embedding in documents

### Visual Testing
- Word cloud layout verification
- Dossier formatting consistency
- PDF output quality across different configurations
- Print preview accuracy

### Test Data
```typescript
const mockPersonData: PersonData[] = [
  {
    person: "John Doe",
    word: "Innovation",
    description: "A forward-thinking individual who brings creative solutions to complex problems.",
    picture: "john_doe.jpg"
  },
  {
    person: "Jane Smith",
    word: "Creativity"
    // description and picture are optional
  },
  {
    person: "Bob Wilson",
    word: "Leadership",
    description: "Natural leader with excellent communication skills."
    // picture is optional
  },
  // Additional test cases...
];
```

## Performance Considerations

### Optimization Strategies

1. **Font Loading**
   - Preload only required Google Fonts
   - Cache font files locally
   - Lazy load fonts for word cloud generation

2. **Image Processing**
   - Compress images before embedding
   - Use appropriate image formats
   - Implement image caching

3. **PDF Generation**
   - Stream large documents
   - Optimize memory usage for large datasets
   - Use web workers for heavy processing

4. **Word Cloud Algorithm**
   - Efficient collision detection
   - Optimized layout algorithms
   - Canvas-based rendering for performance

### Memory Management

```typescript
interface PerformanceConfig {
  maxImageSize: number; // bytes
  maxDatasetSize: number; // number of items
  fontCacheSize: number;
  pdfChunkSize: number;
}
```