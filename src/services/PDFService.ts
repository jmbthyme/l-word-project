import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import type { WordCloudItem, WordCloudConfig, PersonData } from '../types';

/**
 * PDFService handles PDF generation for both Word Cloud and Dossier documents
 * using @react-pdf/renderer for high-quality print output
 */
export class PDFService {
  private fontsRegistered = false;

  /**
   * Register Google Fonts with react-pdf
   * This needs to be called before generating PDFs
   */
  async registerFonts(fonts: string[]): Promise<void> {
    if (this.fontsRegistered) return;

    try {
      // Register common fonts that work well with react-pdf
      const fontRegistrations = fonts.map(async (fontFamily) => {
        try {
          // Use Google Fonts CDN URLs for font registration
          const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700;800;900&display=swap`;
          
          // For react-pdf, we need to register fonts with specific weights
          // This is a simplified approach - in production, you'd want to parse the CSS and extract font URLs
          Font.register({
            family: fontFamily,
            src: fontUrl,
          });
        } catch (error) {
          console.warn(`Failed to register font ${fontFamily}:`, error);
        }
      });

      await Promise.all(fontRegistrations);
      this.fontsRegistered = true;
    } catch (error) {
      console.error('Failed to register fonts:', error);
      // Continue without custom fonts - react-pdf will use defaults
    }
  }

  /**
   * Generate Word Cloud PDF
   * @param items Array of positioned WordCloudItem objects
   * @param config WordCloudConfig for paper size and orientation
   * @returns Promise resolving to PDF Blob
   */
  async generateWordCloudPDF(items: WordCloudItem[], config: WordCloudConfig): Promise<Blob> {
    try {
      // Register fonts used in the word cloud
      const uniqueFonts = [...new Set(items.map(item => item.fontFamily))];
      await this.registerFonts(uniqueFonts);

      // Create PDF document
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
                    fontWeight: item.weight as any,
                    fontFamily: item.fontFamily,
                    color: item.color || '#333333',
                    position: 'absolute',
                    left: item.x || 0,
                    top: item.y || 0,
                  }
                }, item.text)
              )
            )
          )
        )
      );

      // Generate PDF blob
      const blob = await pdf(React.createElement(WordCloudDocument)).toBlob();
      return blob;
    } catch (error) {
      console.error('Failed to generate Word Cloud PDF:', error);
      throw new Error(`Word Cloud PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Dossier PDF (placeholder for future implementation)
   * @param data Array of PersonData
   * @param images Map of filename to base64 image data
   * @returns Promise resolving to PDF Blob
   */
  async generateDossierPDF(data: PersonData[], images: Map<string, string>): Promise<Blob> {
    // This will be implemented in a future task
    throw new Error('Dossier PDF generation not yet implemented');
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
        const textWidth = item.text.length * item.size * 0.6;
        const textHeight = item.size;

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