import { validatePersonData, validateImageFile, validateImageReferences } from '../validation/validators';
import type { PersonData } from '../types';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface DataLoadResult {
  data: PersonData[];
  images: Map<string, string>;
  validation: ValidationResult;
}

export class DataService {
  private static instance: DataService;

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * Loads data from a folder containing JSON and image files
   * @param folderHandle - FileSystemDirectoryHandle for the selected folder
   * @returns Promise with loaded data, images, and validation results
   */
  async loadDataFolder(folderHandle: FileSystemDirectoryHandle): Promise<DataLoadResult> {
    const jsonFiles: File[] = [];
    const imageFiles: File[] = [];
    const availableImageNames: string[] = [];

    // Read all files from the folder
    for await (const [name, handle] of folderHandle.entries()) {
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        
        if (name.toLowerCase().endsWith('.json')) {
          jsonFiles.push(file);
        } else if (this.isImageFile(name)) {
          imageFiles.push(file);
          availableImageNames.push(name);
        }
      }
    }

    // Validate folder structure
    if (jsonFiles.length === 0) {
      throw new Error('No JSON files found in the selected folder');
    }

    // Load and validate JSON data
    let allData: PersonData[] = [];
    for (const jsonFile of jsonFiles) {
      const text = await this.readFileAsText(jsonFile);
      const jsonData = JSON.parse(text);
      const validatedData = validatePersonData(jsonData);
      allData = allData.concat(validatedData);
    }

    // Load images
    const images = await this.loadImages(imageFiles);

    // Validate image references
    const validation = validateImageReferences(allData, availableImageNames);

    return {
      data: allData,
      images,
      validation
    };
  }

  /**
   * Validates JSON data against PersonData schema
   * @param data - Raw JSON data to validate
   * @returns Validated PersonData array
   */
  validateJsonData(data: unknown): PersonData[] {
    return validatePersonData(data);
  }

  /**
   * Processes words for cloud generation
   * @param data - Array of PersonData
   * @returns Array of words for word cloud
   */
  processWordsForCloud(data: PersonData[]): string[] {
    return data.map(item => item.word);
  }

  /**
   * Checks if a filename represents an image file
   * @param filename - Name of the file to check
   * @returns true if it's an image file
   */
  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }

  /**
   * Loads multiple image files and converts them to base64
   * @param files - Array of image files
   * @returns Map of filename to base64 data
   */
  private async loadImages(files: File[]): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();
    
    const loadPromises = files.map(async (file) => {
      if (validateImageFile(file)) {
        try {
          const base64 = await this.readFileAsDataURL(file);
          imageMap.set(file.name, base64);
        } catch (error) {
          console.warn(`Failed to load image ${file.name}:`, error);
          // Don't add to map if loading fails
        }
      }
    });

    await Promise.allSettled(loadPromises);
    return imageMap;
  }

  /**
   * Reads a file as text
   * @param file - File to read
   * @returns Promise with file content as string
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file);
    });
  }

  /**
   * Reads a file as data URL (base64)
   * @param file - File to read
   * @returns Promise with file content as data URL
   */
  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }
}