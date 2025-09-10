import { ZodError } from 'zod';
import { 
  PersonDataArraySchema, 
  WordCloudConfigSchema, 
  PDFConfigSchema,
  type PersonData,
  type WordCloudConfig,
  type PDFConfig
} from './schemas';


/**
 * Validates JSON data against PersonData schema
 * @param data - Raw JSON data to validate
 * @returns Validated PersonData array
 * @throws ValidationError with detailed field information
 */
export function validatePersonData(data: unknown): PersonData[] {
  try {
    return PersonDataArraySchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // Find the first error message to throw
      const firstError = error.issues?.[0];
      if (firstError?.message) {
        throw new Error(firstError.message);
      }
    }
    throw error;
  }
}

/**
 * Validates word cloud configuration
 * @param config - Configuration object to validate
 * @returns Validated WordCloudConfig
 */
export function validateWordCloudConfig(config: unknown): WordCloudConfig {
  try {
    return WordCloudConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues?.[0];
      if (firstError?.message) {
        throw new Error(`Word cloud config validation failed: ${firstError.message}`);
      }
    }
    throw error;
  }
}

/**
 * Validates PDF configuration
 * @param config - Configuration object to validate
 * @returns Validated PDFConfig
 */
export function validatePDFConfig(config: unknown): PDFConfig {
  try {
    return PDFConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues?.[0];
      if (firstError?.message) {
        throw new Error(`PDF config validation failed: ${firstError.message}`);
      }
    }
    throw error;
  }
}

/**
 * Validates image file formats
 * @param file - File to validate
 * @returns true if valid format
 */
export function validateImageFile(file: File): boolean {
  const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg'];
  return supportedFormats.includes(file.type.toLowerCase());
}

/**
 * Validates that required fields exist in PersonData
 * @param data - PersonData object to check
 * @returns Array of missing required field names (only person and word are required)
 */
export function getMissingFields(data: Partial<PersonData>): string[] {
  const requiredFields: (keyof PersonData)[] = ['person', 'word'];
  return requiredFields.filter(field => !data[field] || data[field]?.trim() === '');
}

/**
 * Validates that picture references exist in available images
 * @param data - Array of PersonData to validate
 * @param availableImages - Array of available image filenames
 * @returns Object with validation results and warnings
 */
export function validateImageReferences(data: PersonData[], availableImages: string[]): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    if (item.picture && !availableImages.includes(item.picture)) {
      warnings.push(`Entry ${index + 1} (${item.person}): Picture "${item.picture}" not found in data folder`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}