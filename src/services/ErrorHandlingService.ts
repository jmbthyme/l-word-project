import type { ValidationError, ErrorHandler } from '../types';

/**
 * Centralized error handling service for the PDF Document Generator
 */
export class ErrorHandlingService implements ErrorHandler {
  private static instance: ErrorHandlingService;
  private errorLog: Array<{ timestamp: Date; error: Error; context: string }> = [];
  private readonly maxLogSize = 100;

  private constructor() {}

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle data folder access errors
   */
  handleDataFolderError(error: Error): void {
    this.logError(error, 'Data Folder Access');
    
    let userMessage = 'Failed to access the selected folder.';
    if (error.message.includes('permission')) {
      userMessage = 'Permission denied. Please ensure you have access to the selected folder.';
    } else if (error.message.includes('not found')) {
      userMessage = 'The selected folder could not be found.';
    }
    
    this.showUserError('Folder Access Error', userMessage);
  }

  /**
   * Handle image reference validation errors
   */
  handleImageReferenceError(filename: string, error: Error): void {
    const enhancedError = new Error(`Image reference validation failed for "${filename}": ${error.message}`);
    this.logError(enhancedError, 'Image Reference Validation');
    
    console.warn(`Image reference validation failed for ${filename}`);
    // This is typically handled as a warning, not a blocking error
  }

  /**
   * Handle data validation errors with specific field information
   */
  handleDataValidationError(error: ValidationError): void {
    const enhancedError = new Error(`Validation failed for field "${error.field}": ${error.message}`);
    this.logError(enhancedError, 'Data Validation');
    
    // Provide user-friendly error messages
    const userMessage = this.getUserFriendlyValidationMessage(error);
    this.showUserError('Data Validation Error', userMessage);
  }

  /**
   * Handle image loading errors with fallback options
   */
  handleImageLoadError(filename: string, error: Error): void {
    const enhancedError = new Error(`Failed to load image "${filename}": ${error.message}`);
    this.logError(enhancedError, 'Image Loading');
    
    console.warn(`Image loading failed for ${filename}, will use fallback`);
    
    // Don't show user error for individual image failures - handle gracefully
    // The application should continue with missing image placeholders
  }

  /**
   * Handle PDF generation errors with retry suggestions
   */
  handlePDFGenerationError(type: 'wordcloud' | 'dossier', error: Error): void {
    const enhancedError = new Error(`${type} PDF generation failed: ${error.message}`);
    this.logError(enhancedError, 'PDF Generation');
    
    const userMessage = this.getUserFriendlyPDFErrorMessage(type, error);
    this.showUserError('PDF Generation Error', userMessage);
  }

  /**
   * Handle font loading errors with retry mechanism
   */
  handleFontLoadError(fontFamily: string, error: Error): void {
    const enhancedError = new Error(`Font loading failed for "${fontFamily}": ${error.message}`);
    this.logError(enhancedError, 'Font Loading');
    
    console.warn(`Font loading failed for ${fontFamily}, will use fallback fonts`);
    
    // Don't show user error for individual font failures - handle gracefully
    // The application should continue with fallback fonts
  }

  /**
   * Create a retry mechanism for async operations
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context: string = 'Unknown Operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          this.logError(lastError, `${context} (Final Attempt)`);
          throw lastError;
        }
        
        console.warn(`${context} attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
        await this.sleep(delay);
        
        // Exponential backoff
        delay *= 1.5;
      }
    }
    
    throw lastError!;
  }

  /**
   * Create fallback image data for missing images
   */
  createImageFallback(filename: string, width: number = 200, height: number = 200): string {
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
        <text x="50%" y="40%" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="14">
          Image Not Found
        </text>
        <text x="50%" y="60%" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="12">
          ${filename}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Validate and sanitize error messages for user display
   */
  sanitizeErrorMessage(error: Error | string): string {
    const message = typeof error === 'string' ? error : error.message;
    
    // Remove technical stack traces and internal paths
    return message
      .replace(/at\s+.*\s+\(.*\)/g, '') // Remove stack trace lines
      .replace(/file:\/\/.*\//g, '') // Remove file paths
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get detailed validation errors from Zod errors
   */
  extractValidationErrors(error: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (error?.issues) {
      error.issues.forEach((issue: any) => {
        const field = issue.path?.join('.') || 'unknown';
        errors.push({
          field,
          message: issue.message
        });
      });
    }
    
    return errors;
  }

  /**
   * Check if an error is recoverable
   */
  isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /connection/i,
      /temporary/i
    ];
    
    return recoverablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): { total: number; byContext: Record<string, number> } {
    const byContext: Record<string, number> = {};
    
    this.errorLog.forEach(entry => {
      byContext[entry.context] = (byContext[entry.context] || 0) + 1;
    });
    
    return {
      total: this.errorLog.length,
      byContext
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  private logError(error: Error, context: string): void {
    this.errorLog.push({
      timestamp: new Date(),
      error,
      context
    });
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
    
    console.error(`[${context}]`, error);
  }

  private getUserFriendlyValidationMessage(error: ValidationError): string {
    const fieldMessages: Record<string, string> = {
      'person': 'Please ensure each entry has a valid person name.',
      'word': 'Please ensure each entry has a word for the word cloud.',
      'description': 'Please ensure each entry has a description.',
      'picture': 'Please ensure each entry references a valid image file.'
    };
    
    return fieldMessages[error.field] || `Please check the ${error.field} field: ${error.message}`;
  }

  private getUserFriendlyPDFErrorMessage(type: 'wordcloud' | 'dossier', error: Error): string {
    const typeLabel = type === 'wordcloud' ? 'Word Cloud' : 'Dossier';
    
    if (error.message.includes('memory')) {
      return `${typeLabel} generation failed due to memory limitations. Try reducing the dataset size or image quality.`;
    }
    
    if (error.message.includes('timeout')) {
      return `${typeLabel} generation timed out. This might be due to a large dataset or slow system. Please try again.`;
    }
    
    if (error.message.includes('font')) {
      return `${typeLabel} generation failed due to font loading issues. Please check your internet connection and try again.`;
    }
    
    return `${typeLabel} generation failed. Please check your data and try again. If the problem persists, try refreshing the page.`;
  }

  private showUserError(title: string, message: string): void {
    // This would typically integrate with a toast notification system
    // For now, we'll use console.error and could dispatch a custom event
    console.error(`${title}: ${message}`);
    
    // Dispatch custom event for UI components to listen to
    window.dispatchEvent(new CustomEvent('app-error', {
      detail: { title, message }
    }));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Global error handler for unhandled promise rejections
 */
export const setupGlobalErrorHandling = (): void => {
  const errorService = ErrorHandlingService.getInstance();
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorService.handlePDFGenerationError('wordcloud', new Error(event.reason));
    event.preventDefault();
  });
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    errorService.logError(event.error, 'Global');
  });
};