/**
 * ImageExportService handles exporting word clouds as images (PNG/JPEG)
 * This ensures the downloaded image matches the preview exactly
 */
export class ImageExportService {
  /**
   * Export SVG element as JPEG image
   * @param svgElement The SVG element to export
   * @param filename Desired filename
   * @param config Export configuration
   */
  async exportSVGAsJPEG(
    svgElement: SVGSVGElement, 
    filename: string,
    config: {
      width?: number;
      height?: number;
      backgroundColor?: string;
      quality?: number;
    } = {}
  ): Promise<void> {
    const {
      width = 1200,
      height = 800,
      backgroundColor = '#ffffff',
      quality = 0.95
    } = config;

    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Fill background (important for JPEG as it doesn't support transparency)
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create image from SVG
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to create image blob'));
                return;
              }
              
              // Download the image
              this.downloadBlob(blob, filename);
              
              // Cleanup
              URL.revokeObjectURL(svgUrl);
              resolve();
            }, 'image/jpeg', quality);
          } catch (error) {
            URL.revokeObjectURL(svgUrl);
            reject(error);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG image'));
        };
        
        img.src = svgUrl;
      });
    } catch (error) {
      throw new Error(`JPEG export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export SVG element as PNG image
   * @param svgElement The SVG element to export
   * @param filename Desired filename
   * @param config Export configuration
   */
  async exportSVGAsPNG(
    svgElement: SVGSVGElement, 
    filename: string,
    config: {
      width?: number;
      height?: number;
      backgroundColor?: string;
      quality?: number;
    } = {}
  ): Promise<void> {
    const {
      width = 1200,
      height = 800,
      backgroundColor = '#ffffff',
      quality = 1.0
    } = config;

    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create image from SVG
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to create image blob'));
                return;
              }
              
              // Download the image
              this.downloadBlob(blob, filename);
              
              // Cleanup
              URL.revokeObjectURL(svgUrl);
              resolve();
            }, 'image/png', quality);
          } catch (error) {
            URL.revokeObjectURL(svgUrl);
            reject(error);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG image'));
        };
        
        img.src = svgUrl;
      });
    } catch (error) {
      throw new Error(`Image export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export word cloud as high-resolution image for professional printing
   * @param svgElement The word cloud SVG element
   * @param config Word cloud configuration
   * @param options Export options
   */
  async exportWordCloudAsImage(
    svgElement: SVGSVGElement,
    config: { paperSize: string; orientation: string; colorScheme: string },
    options: {
      filename?: string;
      dpi?: 300 | 600; // 300 DPI for standard print, 600 DPI for high-end printing
      format?: 'png' | 'jpeg';
      quality?: number;
    } = {}
  ): Promise<void> {
    const {
      filename,
      dpi = 300,
      format = 'png',
      quality = 1.0
    } = options;

    // Calculate dimensions based on DPI
    const baseDimensions = this.getPaperDimensions(config.paperSize as 'A4' | 'A3', config.orientation as 'portrait' | 'landscape');
    
    // Scale for higher DPI if requested
    const scaleFactor = dpi / 300;
    const dimensions = {
      width: Math.round(baseDimensions.width * scaleFactor),
      height: Math.round(baseDimensions.height * scaleFactor)
    };
    
    const exportFilename = filename || `word-cloud-${config.paperSize}-${config.orientation}-${config.colorScheme}-${dpi}dpi-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'png') {
      await this.exportSVGAsPNG(svgElement, exportFilename, {
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: '#ffffff',
        quality: 1.0
      });
    } else {
      await this.exportSVGAsJPEG(svgElement, exportFilename, {
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: '#ffffff',
        quality
      });
    }
  }

  /**
   * Get image dimensions based on paper size and orientation
   * @param paperSize Paper size
   * @param orientation Orientation
   * @returns Dimensions in pixels for professional printing
   */
  private getPaperDimensions(paperSize: 'A4' | 'A3', orientation: 'portrait' | 'landscape'): { width: number; height: number } {
    // Professional print-ready dimensions (300 DPI for high-quality printing)
    const dimensions = {
      A4: { width: 2480, height: 3508 }, // 8.27" x 11.69" at 300 DPI
      A3: { width: 3508, height: 4961 }  // 11.69" x 16.54" at 300 DPI
    };

    let { width, height } = dimensions[paperSize];

    // Swap for landscape
    if (orientation === 'landscape') {
      [width, height] = [height, width];
    }

    return { width, height };
  }

  /**
   * Download blob as file
   * @param blob Blob to download
   * @param filename Desired filename
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get SVG element from word cloud container
   * @param containerId ID of the container element
   * @returns SVG element or null if not found
   */
  getWordCloudSVG(_containerId: string = 'word-cloud-container'): SVGSVGElement | null {
    const container = document.querySelector(`[class*="word-cloud-container"]`);
    if (!container) {
      console.error('Word cloud container not found');
      return null;
    }
    
    const svg = container.querySelector('svg');
    if (!svg) {
      console.error('SVG element not found in word cloud container');
      return null;
    }
    
    return svg;
  }
}