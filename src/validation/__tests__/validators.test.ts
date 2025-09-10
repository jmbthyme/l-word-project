import { describe, it, expect } from 'vitest';
import { 
  validatePersonData, 
  validateWordCloudConfig, 
  validatePDFConfig,
  validateImageFile,
  getMissingFields
} from '../validators';
import type { PersonData, WordCloudConfig, PDFConfig } from '../schemas';

describe('validatePersonData', () => {
  it('should validate correct PersonData array', () => {
    const validData = [
      {
        person: 'John Doe',
        word: 'Innovation',
        description: 'A creative thinker',
        picture: 'john.jpg'
      },
      {
        person: 'Jane Smith',
        word: 'Leadership',
        description: 'A natural leader',
        picture: 'jane.png'
      }
    ];

    const result = validatePersonData(validData);
    expect(result).toEqual(validData);
  });

  it('should throw error for empty array', () => {
    expect(() => validatePersonData([])).toThrow('At least one person data entry is required');
  });

  it('should throw error for missing required fields', () => {
    const invalidData = [
      {
        person: '',
        word: 'Innovation',
        description: 'A creative thinker',
        picture: 'john.jpg'
      }
    ];

    expect(() => validatePersonData(invalidData)).toThrow('Person name is required');
  });

  it('should throw error for missing word field', () => {
    const invalidData = [
      {
        person: 'John Doe',
        word: '',
        description: 'A creative thinker',
        picture: 'john.jpg'
      }
    ];

    expect(() => validatePersonData(invalidData)).toThrow('Word is required');
  });

  it('should accept missing or empty description field', () => {
    const validData = [
      {
        person: 'John Doe',
        word: 'Innovation',
        picture: 'john.jpg'
      },
      {
        person: 'Jane Smith',
        word: 'Creativity',
        description: '',
        picture: 'jane.jpg'
      }
    ];

    const result = validatePersonData(validData);
    expect(result).toEqual(validData);
  });

  it('should accept missing or empty picture field', () => {
    const validData = [
      {
        person: 'John Doe',
        word: 'Innovation',
        description: 'A creative thinker'
      },
      {
        person: 'Jane Smith',
        word: 'Leadership',
        description: 'A natural leader',
        picture: ''
      }
    ];

    const result = validatePersonData(validData);
    expect(result).toEqual(validData);
  });

  it('should throw error for non-array input', () => {
    expect(() => validatePersonData('not an array')).toThrow();
  });
});

describe('validateWordCloudConfig', () => {
  it('should validate correct WordCloudConfig', () => {
    const validConfig: WordCloudConfig = {
      paperSize: 'A4',
      orientation: 'portrait'
    };

    const result = validateWordCloudConfig(validConfig);
    expect(result).toEqual(validConfig);
  });

  it('should validate A3 landscape configuration', () => {
    const validConfig: WordCloudConfig = {
      paperSize: 'A3',
      orientation: 'landscape'
    };

    const result = validateWordCloudConfig(validConfig);
    expect(result).toEqual(validConfig);
  });

  it('should throw error for invalid paper size', () => {
    const invalidConfig = {
      paperSize: 'A5',
      orientation: 'portrait'
    };

    expect(() => validateWordCloudConfig(invalidConfig)).toThrow();
  });

  it('should throw error for invalid orientation', () => {
    const invalidConfig = {
      paperSize: 'A4',
      orientation: 'vertical'
    };

    expect(() => validateWordCloudConfig(invalidConfig)).toThrow();
  });
});

describe('validatePDFConfig', () => {
  it('should validate correct PDFConfig', () => {
    const validConfig: PDFConfig = {
      paperSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    };

    const result = validatePDFConfig(validConfig);
    expect(result).toEqual(validConfig);
  });

  it('should throw error for negative margins', () => {
    const invalidConfig = {
      paperSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: -10,
        right: 20,
        bottom: 20,
        left: 20
      }
    };

    expect(() => validatePDFConfig(invalidConfig)).toThrow();
  });

  it('should throw error for missing margins', () => {
    const invalidConfig = {
      paperSize: 'A4',
      orientation: 'portrait'
    };

    expect(() => validatePDFConfig(invalidConfig)).toThrow();
  });
});

describe('validateImageFile', () => {
  it('should return true for PNG files', () => {
    const pngFile = new File([''], 'test.png', { type: 'image/png' });
    expect(validateImageFile(pngFile)).toBe(true);
  });

  it('should return true for JPEG files', () => {
    const jpegFile = new File([''], 'test.jpeg', { type: 'image/jpeg' });
    expect(validateImageFile(jpegFile)).toBe(true);
  });

  it('should return true for JPG files', () => {
    const jpgFile = new File([''], 'test.jpg', { type: 'image/jpg' });
    expect(validateImageFile(jpgFile)).toBe(true);
  });

  it('should return false for unsupported file types', () => {
    const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
    expect(validateImageFile(gifFile)).toBe(false);
  });

  it('should return false for non-image files', () => {
    const textFile = new File([''], 'test.txt', { type: 'text/plain' });
    expect(validateImageFile(textFile)).toBe(false);
  });
});

describe('getMissingFields', () => {
  it('should return empty array for complete PersonData', () => {
    const completeData: PersonData = {
      person: 'John Doe',
      word: 'Innovation',
      description: 'A creative thinker',
      picture: 'john.jpg'
    };

    expect(getMissingFields(completeData)).toEqual([]);
  });

  it('should return missing required field names', () => {
    const incompleteData = {
      person: 'John Doe',
      word: '',
      description: 'A creative thinker'
      // picture is missing but optional
    };

    const missing = getMissingFields(incompleteData);
    expect(missing).toContain('word');
    expect(missing).not.toContain('picture'); // picture is optional
    expect(missing).not.toContain('description'); // description is optional
  });

  it('should detect empty string fields for required fields only', () => {
    const dataWithEmptyFields = {
      person: '   ',
      word: 'Innovation',
      description: '',
      picture: 'john.jpg'
    };

    const missing = getMissingFields(dataWithEmptyFields);
    expect(missing).toContain('person');
    expect(missing).not.toContain('description'); // description is optional
  });

  it('should return only required fields for empty object', () => {
    const missing = getMissingFields({});
    expect(missing).toEqual(['person', 'word']);
  });
});