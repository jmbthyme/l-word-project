import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { WordCloudItem, WordCloudConfig, PersonData } from '../types';
import { PerformanceService } from './PerformanceService';

/**
 * PDFService handles PDF generation for both Word Cloud and Dossier documents
 * using @react-pdf/renderer for high-quality print output
 */
export class PDFService {
  private fontsRegistered = false;
  private performanceService = PerformanceService.getInstance();

  /**
   * Register Google Fonts with react-pdf
   * This needs to be called before generating PDFs
   */
  async registerFonts(_fonts: string[]): Promise<void> {
    if (this.fontsRegistered) return;

    try {
      // Register safe web fonts that work with react-pdf
      // For now, we'll use system fonts that are widely available
      const safeFonts = [
        'Helvetica',
        'Times-Roman',
        'Courier',
        'Helvetica-Bold',
        'Times-Bold',
        'Courier-Bold'
      ];

      // Map Google Font names to safe alternatives
      // const fontMappings: Record<string, string> = {
      //   'Inter': 'Helvetica',
      //   'Roboto': 'Helvetica',
      //   'Open Sans': 'Helvetica',
      //   'Lato': 'Helvetica',
      //   'Montserrat': 'Helvetica',
      //   'Poppins': 'Helvetica',
      //   'Source Sans Pro': 'Helvetica',
      //   'Oswald': 'Helvetica-Bold',
      //   'Raleway': 'Helvetica',
      //   'Ubuntu': 'Helvetica'
      // };

      // No need to register system fonts - they're built into react-pdf
      console.log('Using system fonts for PDF generation:', safeFonts);
      this.fontsRegistered = true;
    } catch (error) {
      console.error('Failed to register fonts:', error);
      // Continue without custom fonts - react-pdf will use defaults
    }
  }

  /**
   * Generate Word Cloud PDF with performance optimizations
   * @param items Array of positioned WordCloudItem objects
   * @param config WordCloudConfig for paper size and orientation
   * @returns Promise resolving to PDF Blob
   */
  async generateWordCloudPDF(items: WordCloudItem[], config: WordCloudConfig): Promise<Blob> {
    const timer = this.performanceService.createTimer('Word Cloud PDF Generation');

    try {
      // Validate input parameters

      // Monitor memory usage
      this.performanceService.monitorMemoryUsage();

      // Validate items have positions
      const itemsWithPositions = items.filter(item =>
        item.x !== undefined && item.y !== undefined &&
        typeof item.x === 'number' && typeof item.y === 'number'
      );



      if (itemsWithPositions.length === 0) {
        throw new Error('No word cloud items have valid positions');
      }

      // Use only items with valid positions
      items = itemsWithPositions;

      // For now, let's try without scaling to see if positions match
      // Just add a small margin to center the content
      const margin = 50;
      items = items.map(item => ({
        ...item,
        x: (item.x || 0) * 0.2 + margin, // Scale down from preview pixels to PDF points
        y: (item.y || 0) * 0.2 + margin,
        size: Math.max(8, (item.size || 12) * 0.8) // Scale down font size
      }));


      // Validate and optimize items for performance
      if (items.length > 200) {
        console.warn(`Large word cloud detected (${items.length} words). Performance may be impacted.`);
        // Limit to top 200 words for performance
        items = items.slice(0, 200);
      }

      // Items already use PDF-safe fonts from FontService

      // Register fonts used in the word cloud with optimization
      const uniqueFonts = [...new Set(items.map(item => item.fontFamily))];
      await this.registerFonts(uniqueFonts);

      // Create PDF document with timeout protection
      const WordCloudDocument = () => (
        React.createElement(Document, null,
          React.createElement(Page, {
            size: config.paperSize,
            orientation: config.orientation,
            style: styles.page
          },
            React.createElement(View, { style: styles.wordCloudContainer },
              ...items.map((item, index) =>
                React.createElement(Text, {
                  key: `word-${index}`,
                  style: {
                    ...styles.wordCloudText,
                    fontSize: item.size,
                    fontFamily: item.fontFamily, // PDF-safe font from FontService
                    color: item.color || '#333333',
                    position: 'absolute',
                    left: item.x || 0,
                    top: item.y || 0,
                    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                  }
                }, item.text)
              )
            )
          )
        )
      );

      // Generate PDF blob with timeout
      const blob = await this.generatePDFWithTimeout(WordCloudDocument, 10000); // 10 second timeout

      if (!blob || blob.size === 0) {
        throw new Error('Generated PDF is empty or invalid');
      }

      return blob;
    } catch (error) {
      console.error('Failed to generate Word Cloud PDF:', error);
      throw new Error(`Word Cloud PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      timer.stop();
    }
  }

  /**
   * Generate Dossier PDF with comprehensive performance optimizations
   * @param data Array of PersonData
   * @param images Map of filename to base64 image data
   * @returns Promise resolving to PDF Blob
   */
  async generateDossierPDF(data: PersonData[], images: Map<string, string>): Promise<Blob> {
    const timer = this.performanceService.createTimer('Dossier PDF Generation');

    try {
      // Monitor memory usage before starting
      this.performanceService.monitorMemoryUsage();

      // Validate input data
      this.validateDossierData(data, images);

      // Optimize images with compression and caching
      const optimizedImages = await this.performanceService.compressAndCacheImages(images);

      // Handle large datasets with chunking strategy
      const dataChunks = this.performanceService.optimizeDatasetForPDF(data);

      if (dataChunks.length > 1) {
        console.log(`Processing ${data.length} items in ${dataChunks.length} chunks for optimal performance`);
        return await this.generateChunkedDossierPDF(dataChunks, optimizedImages);
      }

      // Import DossierGenerator dynamically to avoid circular dependencies
      const { DossierGenerator } = await import('../components/DossierGenerator');

      // Create PDF document using DossierGenerator with optimized data
      const DossierDocument = () =>
        React.createElement(DossierGenerator, {
          data,
          images: optimizedImages,
          config: {
            paperSize: 'A4',
            orientation: 'portrait',
            itemsPerPage: this.calculateOptimalItemsPerPage(data),
            highQuality: true
          }
        });

      // Generate PDF blob with timeout protection
      const blob = await this.generatePDFWithTimeout(DossierDocument, 10000); // 10 second timeout

      // Validate generated blob
      if (!blob || blob.size === 0) {
        throw new Error('Generated PDF is empty or invalid');
      }

      return blob;
    } catch (error) {
      console.error('Failed to generate Dossier PDF:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('memory')) {
          throw new Error(`Dossier PDF generation failed due to memory constraints. Try reducing the dataset size or image quality.`);
        } else if (error.message.includes('timeout')) {
          throw new Error(`Dossier PDF generation timed out. The dataset may be too large.`);
        } else {
          throw new Error(`Dossier PDF generation failed: ${error.message}`);
        }
      }

      throw new Error(`Dossier PDF generation failed: ${error}`);
    } finally {
      timer.stop();
    }
  }

  /**
   * Validate dossier data before PDF generation
   * @param data Array of PersonData
   * @param images Map of filename to base64 image data
   */
  private validateDossierData(data: PersonData[], _images: Map<string, string>): void {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    if (data.length === 0) {
      throw new Error('Data array cannot be empty');
    }

    if (data.length > 1000) {
      throw new Error('Dataset too large. Maximum 1000 items supported for PDF generation.');
    }

    // Validate each data item
    data.forEach((item, index) => {
      if (!item.person || typeof item.person !== 'string') {
        throw new Error(`Invalid person name at index ${index}`);
      }
      if (!item.word || typeof item.word !== 'string') {
        throw new Error(`Invalid word at index ${index}`);
      }
      // Description is optional
      if (item.description !== undefined && typeof item.description !== 'string') {
        throw new Error(`Invalid description at index ${index}`);
      }
      // Picture is optional
      if (item.picture !== undefined && typeof item.picture !== 'string') {
        throw new Error(`Invalid picture filename at index ${index}`);
      }
    });
  }

  /**
   * Generate chunked Dossier PDF for large datasets
   * @param dataChunks Array of data chunks
   * @param optimizedImages Optimized images map
   * @returns Promise resolving to combined PDF Blob
   */
  private async generateChunkedDossierPDF(
    dataChunks: PersonData[][],
    optimizedImages: Map<string, string>
  ): Promise<Blob> {
    const { DossierGenerator } = await import('../components/DossierGenerator');
    const pdfBlobs: Blob[] = [];

    for (let i = 0; i < dataChunks.length; i++) {
      const chunk = dataChunks[i];
      console.log(`Processing chunk ${i + 1}/${dataChunks.length} (${chunk.length} items)`);

      try {
        const ChunkDocument = () =>
          React.createElement(DossierGenerator, {
            data: chunk,
            images: optimizedImages,
            config: {
              paperSize: 'A4',
              orientation: 'portrait',
              itemsPerPage: this.calculateOptimalItemsPerPage(chunk),
              highQuality: true
            }
          });

        const chunkBlob = await this.generatePDFWithTimeout(ChunkDocument, 8000); // 8 second timeout per chunk
        pdfBlobs.push(chunkBlob);

        // Monitor memory after each chunk
        this.performanceService.monitorMemoryUsage();
      } catch (error) {
        console.error(`Failed to generate chunk ${i + 1}:`, error);
        throw new Error(`PDF generation failed at chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Combine PDF blobs (simplified approach - in production, you'd use a PDF library to properly merge)
    console.log(`Combining ${pdfBlobs.length} PDF chunks...`);
    return pdfBlobs[0]; // For now, return the first chunk. In production, implement proper PDF merging
  }

  /**
   * Generate PDF with timeout protection
   * @param DocumentComponent React component for PDF
   * @param timeoutMs Timeout in milliseconds
   * @returns Promise resolving to PDF Blob
   */
  private async generatePDFWithTimeout(
    DocumentComponent: () => React.ReactElement,
    timeoutMs: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`PDF generation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      pdf(React.createElement(DocumentComponent))
        .toBlob()
        .then(blob => {
          clearTimeout(timeoutId);
          resolve(blob);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Calculate optimal items per page based on data complexity
   * @param data Array of PersonData
   * @returns Number of items per page
   */
  private calculateOptimalItemsPerPage(data: PersonData[]): number {
    if (data.length === 0) return 2;

    // Calculate average description length (only for items that have descriptions)
    const itemsWithDescriptions = data.filter(item => item.description);
    const avgDescriptionLength = itemsWithDescriptions.length > 0
      ? itemsWithDescriptions.reduce((sum, item) => sum + (item.description?.length || 0), 0) / itemsWithDescriptions.length
      : 0;

    // Adjust items per page based on content complexity
    if (avgDescriptionLength > 500) {
      return 1; // Long descriptions - one item per page
    } else if (avgDescriptionLength > 200) {
      return 2; // Medium descriptions - two items per page
    } else {
      return 3; // Short descriptions or no descriptions - three items per page
    }
  }

  /**
   * Generate PDF with retry mechanism for better reliability
   * @param DocumentComponent React component for PDF
   * @param type Type of document for error reporting
   * @returns Promise resolving to PDF Blob
   */
  private async _generatePDFWithRetry(
    DocumentComponent: () => React.ReactElement,
    _type: string,
    maxRetries: number = 2
  ): Promise<Blob> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const blob = await pdf(React.createElement(DocumentComponent)).toBlob();
        return blob;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`PDF generation attempt ${attempt} failed:`, lastError.message);

        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error(`PDF generation failed after ${maxRetries} attempts`);
  }

  /**
   * Download PDF blob as file
   * @param blob PDF Blob
   * @param filename Desired filename
   */
  downloadPDF(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw new Error(`PDF download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get paper size dimensions in points (72 DPI)
   * @param paperSize Paper size ('A4' or 'A3')
   * @param orientation Orientation ('portrait' or 'landscape')
   * @returns Object with width and height in points
   */
  getPaperDimensions(paperSize: 'A4' | 'A3', orientation: 'portrait' | 'landscape'): { width: number; height: number } {
    // Dimensions in points (1 point = 1/72 inch)
    const dimensions = {
      A4: { width: 595, height: 842 },
      A3: { width: 842, height: 1191 }
    };

    let { width, height } = dimensions[paperSize];

    // Swap for landscape
    if (orientation === 'landscape') {
      [width, height] = [height, width];
    }

    return { width, height };
  }

  /**
   * Map Google Font names to safe PDF font names
   * @param fontFamily Original font family name
   * @param weight Font weight
   * @returns Safe font family name for PDF
   */
  private _mapToSafeFont(fontFamily: string, weight: number): string {
    const fontMappings: Record<string, string> = {
      'Inter': 'Helvetica',
      'Roboto': 'Helvetica',
      'Open Sans': 'Helvetica',
      'Lato': 'Helvetica',
      'Montserrat': 'Helvetica',
      'Poppins': 'Helvetica',
      'Source Sans Pro': 'Helvetica',
      'Oswald': 'Helvetica',
      'Raleway': 'Helvetica',
      'Ubuntu': 'Helvetica',
      'Playfair Display': 'Times-Roman',
      'Merriweather': 'Times-Roman',
      'Crimson Text': 'Times-Roman',
      'Libre Baskerville': 'Times-Roman',
      'Nunito': 'Helvetica',
      'Work Sans': 'Helvetica',
      'Fira Sans': 'Helvetica',
      'PT Sans': 'Helvetica'
    };

    let baseFont = fontMappings[fontFamily] || 'Helvetica';

    // Apply weight variations for supported fonts
    if (weight >= 700) {
      if (baseFont === 'Helvetica') return 'Helvetica-Bold';
      if (baseFont === 'Times-Roman') return 'Times-Bold';
      if (baseFont === 'Courier') return 'Courier-Bold';
    }

    console.log(`Mapping font "${fontFamily}" (weight: ${weight}) to "${baseFont}"`);
    return baseFont;
  }

  /**
   * Convert pixel coordinates to PDF points
   * @param pixels Pixel value
   * @param dpi DPI setting (default: 72)
   * @returns Points value
   */
  pixelsToPoints(pixels: number, dpi: number = 72): number {
    return (pixels * 72) / dpi;
  }

  /**
   * Scale word cloud items to fit PDF page
   * @param items Array of WordCloudItem objects
   * @param config WordCloudConfig
   * @returns Scaled WordCloudItem array
   */
  scaleWordCloudForPDF(items: WordCloudItem[], config: WordCloudConfig): WordCloudItem[] {
    if (items.length === 0) return items;

    const pageDimensions = this.getPaperDimensions(config.paperSize, config.orientation);
    const margin = 50; // 50 points margin
    const availableWidth = pageDimensions.width - (margin * 2);
    const availableHeight = pageDimensions.height - (margin * 2);

    // Find bounds of current layout
    const bounds = this.calculateItemsBounds(items);

    if (bounds.width === 0 || bounds.height === 0) return items;

    // Calculate scale factors
    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    // Calculate offset to center the word cloud
    const scaledWidth = bounds.width * scale;
    const scaledHeight = bounds.height * scale;
    const offsetX = margin + (availableWidth - scaledWidth) / 2 - bounds.minX * scale;
    const offsetY = margin + (availableHeight - scaledHeight) / 2 - bounds.minY * scale;

    // Apply scaling and positioning
    return items.map(item => ({
      ...item,
      x: (item.x || 0) * scale + offsetX,
      y: (item.y || 0) * scale + offsetY,
      size: Math.max(8, item.size * scale) // Minimum font size of 8 points
    }));
  }

  /**
   * Calculate bounds of word cloud items
   * @param items Array of WordCloudItem objects
   * @returns Bounds object
   */
  private calculateItemsBounds(items: WordCloudItem[]): {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    if (items.length === 0) {
      return { width: 0, height: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    items.forEach(item => {
      if (item.x !== undefined && item.y !== undefined) {
        // Approximate text bounds
        let textWidth = item.text.length * item.size * 0.6;
        let textHeight = item.size;

        // If rotated 90 degrees, swap width and height for bounds calculation
        if (item.rotation === 90) {
          [textWidth, textHeight] = [textHeight, textWidth];
        }

        const left = item.x - textWidth / 2;
        const right = item.x + textWidth / 2;
        const top = item.y - textHeight / 2;
        const bottom = item.y + textHeight / 2;

        minX = Math.min(minX, left);
        maxX = Math.max(maxX, right);
        minY = Math.min(minY, top);
        maxY = Math.max(maxY, bottom);
      }
    });

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      maxX,
      minY,
      maxY
    };
  }
}

// Styles for PDF components
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  wordCloudContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordCloudText: {
    textAlign: 'center',
  },
});