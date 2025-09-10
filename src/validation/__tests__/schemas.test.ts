import { describe, it, expect } from 'vitest';
import { 
  PersonDataSchema,
  PersonDataArraySchema,
  WordCloudConfigSchema,
  PDFConfigSchema,
  GoogleFontSchema,
  WordCloudItemSchema
} from '../schemas';

describe('PersonDataSchema', () => {
  it('should validate complete PersonData object', () => {
    const validData = {
      person: 'John Doe',
      word: 'Innovation',
      description: 'A creative thinker',
      picture: 'john.jpg'
    };

    const result = PersonDataSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it('should validate PersonData with only required fields', () => {
    const validData = {
      person: 'Jane Smith',
      word: 'Creativity'
    };

    const result = PersonDataSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it('should validate PersonData with description but no picture', () => {
    const validData = {
      person: 'Bob Wilson',
      word: 'Leadership',
      description: 'Natural leader with excellent communication skills.'
    };

    const result = PersonDataSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it('should validate PersonData with picture but no description', () => {
    const validData = {
      person: 'Alice Johnson',
      word: 'Innovation',
      picture: 'alice.jpg'
    };

    const result = PersonDataSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it('should reject empty person name', () => {
    const invalidData = {
      person: '',
      word: 'Innovation',
      description: 'A creative thinker',
      picture: 'john.jpg'
    };

    expect(() => PersonDataSchema.parse(invalidData)).toThrow();
  });

  it('should reject empty word', () => {
    const invalidData = {
      person: 'John Doe',
      word: '',
      description: 'A creative thinker',
      picture: 'john.jpg'
    };

    expect(() => PersonDataSchema.parse(invalidData)).toThrow();
  });
});

describe('PersonDataArraySchema', () => {
  it('should validate array of complete PersonData', () => {
    const validArray = [
      {
        person: 'John Doe',
        word: 'Innovation',
        description: 'A creative thinker',
        picture: 'john.jpg'
      }
    ];

    const result = PersonDataArraySchema.parse(validArray);
    expect(result).toEqual(validArray);
  });

  it('should validate mixed array with optional fields', () => {
    const validArray = [
      {
        person: 'John Doe',
        word: 'Innovation',
        description: 'A creative thinker',
        picture: 'john.jpg'
      },
      {
        person: 'Jane Smith',
        word: 'Creativity'
      },
      {
        person: 'Bob Wilson',
        word: 'Leadership',
        description: 'Natural leader with excellent communication skills.'
      },
      {
        person: 'Alice Johnson',
        word: 'Innovation',
        picture: 'alice.jpg'
      }
    ];

    const result = PersonDataArraySchema.parse(validArray);
    expect(result).toEqual(validArray);
  });

  it('should reject empty array', () => {
    expect(() => PersonDataArraySchema.parse([])).toThrow();
  });
});

describe('WordCloudConfigSchema', () => {
  it('should validate A4 portrait config', () => {
    const config = {
      paperSize: 'A4' as const,
      orientation: 'portrait' as const
    };

    const result = WordCloudConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should validate A3 landscape config', () => {
    const config = {
      paperSize: 'A3' as const,
      orientation: 'landscape' as const
    };

    const result = WordCloudConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should reject invalid paper size', () => {
    const config = {
      paperSize: 'Letter',
      orientation: 'portrait'
    };

    expect(() => WordCloudConfigSchema.parse(config)).toThrow();
  });
});

describe('PDFConfigSchema', () => {
  it('should validate complete PDF config', () => {
    const config = {
      paperSize: 'A4' as const,
      orientation: 'portrait' as const,
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    };

    const result = PDFConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should reject negative margins', () => {
    const config = {
      paperSize: 'A4' as const,
      orientation: 'portrait' as const,
      margins: {
        top: -5,
        right: 20,
        bottom: 20,
        left: 20
      }
    };

    expect(() => PDFConfigSchema.parse(config)).toThrow();
  });
});

describe('GoogleFontSchema', () => {
  it('should validate Google Font object', () => {
    const font = {
      family: 'Roboto',
      weights: [400, 700]
    };

    const result = GoogleFontSchema.parse(font);
    expect(result).toEqual(font);
  });

  it('should reject invalid font weights', () => {
    const font = {
      family: 'Roboto',
      weights: [50, 1000] // Invalid weights
    };

    expect(() => GoogleFontSchema.parse(font)).toThrow();
  });
});

describe('WordCloudItemSchema', () => {
  it('should validate complete WordCloudItem', () => {
    const item = {
      text: 'Innovation',
      size: 24,
      weight: 700,
      fontFamily: 'Roboto',
      color: '#333333',
      x: 100,
      y: 200
    };

    const result = WordCloudItemSchema.parse(item);
    expect(result).toEqual(item);
  });

  it('should validate minimal WordCloudItem', () => {
    const item = {
      text: 'Innovation',
      size: 24,
      weight: 400,
      fontFamily: 'Roboto'
    };

    const result = WordCloudItemSchema.parse(item);
    expect(result).toEqual(item);
  });

  it('should reject invalid font weight', () => {
    const item = {
      text: 'Innovation',
      size: 24,
      weight: 50, // Too low
      fontFamily: 'Roboto'
    };

    expect(() => WordCloudItemSchema.parse(item)).toThrow();
  });

  it('should reject empty text', () => {
    const item = {
      text: '',
      size: 24,
      weight: 400,
      fontFamily: 'Roboto'
    };

    expect(() => WordCloudItemSchema.parse(item)).toThrow();
  });
});