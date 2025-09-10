import { z } from 'zod';

// Schema for PersonData validation
export const PersonDataSchema = z.object({
  person: z.string().min(1, 'Person name is required'),
  word: z.string().min(1, 'Word is required'),
  description: z.string().optional(),
  picture: z.string().optional(),
});

// Schema for array of PersonData
export const PersonDataArraySchema = z.array(PersonDataSchema).min(1, 'At least one person data entry is required');

// Schema for WordCloudConfig
export const WordCloudConfigSchema = z.object({
  paperSize: z.enum(['A4', 'A3']),
  orientation: z.enum(['portrait', 'landscape']),
});

// Schema for PDFConfig
export const PDFConfigSchema = z.object({
  paperSize: z.enum(['A4', 'A3']),
  orientation: z.enum(['portrait', 'landscape']),
  margins: z.object({
    top: z.number().min(0),
    right: z.number().min(0),
    bottom: z.number().min(0),
    left: z.number().min(0),
  }),
});

// Schema for GoogleFont
export const GoogleFontSchema = z.object({
  family: z.string().min(1),
  weights: z.array(z.number().min(100).max(900)),
});

// Schema for WordCloudItem
export const WordCloudItemSchema = z.object({
  text: z.string().min(1),
  size: z.number().min(1),
  weight: z.number().min(100).max(900),
  fontFamily: z.string().min(1),
  color: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

// Export types inferred from schemas
export type PersonData = z.infer<typeof PersonDataSchema>;
export type PersonDataArray = z.infer<typeof PersonDataArraySchema>;
export type WordCloudConfig = z.infer<typeof WordCloudConfigSchema>;
export type PDFConfig = z.infer<typeof PDFConfigSchema>;
export type GoogleFont = z.infer<typeof GoogleFontSchema>;
export type WordCloudItem = z.infer<typeof WordCloudItemSchema>;