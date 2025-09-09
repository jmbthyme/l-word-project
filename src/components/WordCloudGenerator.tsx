import React, { useMemo } from 'react';
import type { WordCloudItem, WordCloudConfig, GoogleFont, PersonData } from '../types';

export interface WordCloudGeneratorProps {
  data: PersonData[];
  config: WordCloudConfig;
  fonts: GoogleFont[];
  onWordsGenerated?: (words: WordCloudItem[]) => void;
}

export interface WordCloudLayoutResult {
  words: WordCloudItem[];
  bounds: {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * WordCloudGenerator component that creates a word cloud layout from PersonData
 * Implements collision detection and positioning logic for optimal word placement
 */
export const WordCloudGenerator: React.FC<WordCloudGeneratorProps> = ({
  data,
  config,
  fonts,
  onWordsGenerated
}) => {
  // Calculate word frequencies and generate word cloud items
  const wordCloudItems = useMemo(() => {
    const wordFrequency = calculateWordFrequency(data);
    const items = generateWordCloudItems(wordFrequency, fonts);
    const layoutResult = generateWordCloudLayout(items, config);
    
    if (onWordsGenerated) {
      onWordsGenerated(layoutResult.words);
    }
    
    return layoutResult;
  }, [data, config, fonts, onWordsGenerated]);

  return (
    <div className="word-cloud-container relative w-full h-full overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox={`${wordCloudItems.bounds.minX} ${wordCloudItems.bounds.minY} ${wordCloudItems.bounds.width} ${wordCloudItems.bounds.height}`}
        className="word-cloud-svg"
      >
        {wordCloudItems.words.map((word, index) => (
          <text
            key={`${word.text}-${index}`}
            x={word.x}
            y={word.y}
            fontSize={word.size}
            fontFamily={word.fontFamily}
            fontWeight={word.weight}
            fill={word.color || '#333'}
            textAnchor="middle"
            dominantBaseline="middle"
            className="word-cloud-text select-none"
          >
            {word.text}
          </text>
        ))}
      </svg>
    </div>
  );
};

/**
 * Calculate word frequency from PersonData array
 * @param data Array of PersonData
 * @returns Map of word to frequency count
 */
export function calculateWordFrequency(data: PersonData[]): Map<string, number> {
  const frequency = new Map<string, number>();
  
  data.forEach(item => {
    const word = item.word.toLowerCase().trim();
    if (word) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  });
  
  return frequency;
}

/**
 * Generate WordCloudItem array from word frequency data
 * @param wordFrequency Map of word to frequency
 * @param fonts Available Google Fonts
 * @returns Array of WordCloudItem objects
 */
export function generateWordCloudItems(
  wordFrequency: Map<string, number>,
  fonts: GoogleFont[]
): WordCloudItem[] {
  if (fonts.length === 0) {
    throw new Error('No fonts available for word cloud generation');
  }

  const words = Array.from(wordFrequency.entries());
  const maxFrequency = Math.max(...wordFrequency.values());
  const minFrequency = Math.min(...wordFrequency.values());
  
  // Define size range for words (in pixels)
  const MIN_SIZE = 16;
  const MAX_SIZE = 72;
  
  return words.map(([text, frequency]) => {
    // Calculate size based on frequency (logarithmic scaling for better distribution)
    const normalizedFreq = frequency === maxFrequency && maxFrequency === minFrequency 
      ? 1 
      : (Math.log(frequency) - Math.log(minFrequency)) / (Math.log(maxFrequency) - Math.log(minFrequency));
    
    const size = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * normalizedFreq;
    
    // Select random font and weight
    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
    const randomWeight = randomFont.weights[Math.floor(Math.random() * randomFont.weights.length)];
    
    // Generate random color (optional - can be overridden)
    const colors = ['#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      text,
      size: Math.round(size),
      weight: randomWeight,
      fontFamily: randomFont.family,
      color: randomColor,
      x: 0, // Will be set by layout algorithm
      y: 0  // Will be set by layout algorithm
    };
  });
}
/**

 * Generate word cloud layout with collision detection and positioning
 * @param items Array of WordCloudItem objects (without positions)
 * @param config WordCloudConfig for paper size and orientation
 * @returns WordCloudLayoutResult with positioned words and bounds
 */
export function generateWordCloudLayout(
  items: WordCloudItem[],
  config: WordCloudConfig
): WordCloudLayoutResult {
  if (items.length === 0) {
    return {
      words: [],
      bounds: { width: 0, height: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 }
    };
  }

  // Calculate canvas dimensions based on config
  const canvasDimensions = getCanvasDimensions(config);
  const centerX = canvasDimensions.width / 2;
  const centerY = canvasDimensions.height / 2;
  
  // Sort items by size (largest first for better placement)
  const sortedItems = [...items].sort((a, b) => b.size - a.size);
  const positionedWords: WordCloudItem[] = [];
  
  // Place each word using spiral positioning with collision detection
  for (const item of sortedItems) {
    const position = findOptimalPosition(item, positionedWords, centerX, centerY, canvasDimensions);
    
    const positionedWord: WordCloudItem = {
      ...item,
      x: position.x,
      y: position.y
    };
    
    positionedWords.push(positionedWord);
  }
  
  // Calculate bounds of the final layout
  const bounds = calculateLayoutBounds(positionedWords);
  
  return {
    words: positionedWords,
    bounds
  };
}

/**
 * Get canvas dimensions based on paper size and orientation
 * @param config WordCloudConfig
 * @returns Object with width and height in pixels
 */
function getCanvasDimensions(config: WordCloudConfig): { width: number; height: number } {
  // Base dimensions in pixels (approximate print dimensions at 300 DPI)
  const A4_WIDTH = 2480; // 8.27 inches * 300 DPI
  const A4_HEIGHT = 3508; // 11.69 inches * 300 DPI
  const A3_WIDTH = 3508; // 11.69 inches * 300 DPI
  const A3_HEIGHT = 4961; // 16.54 inches * 300 DPI
  
  let width: number, height: number;
  
  if (config.paperSize === 'A4') {
    width = A4_WIDTH;
    height = A4_HEIGHT;
  } else {
    width = A3_WIDTH;
    height = A3_HEIGHT;
  }
  
  // Swap dimensions for landscape orientation
  if (config.orientation === 'landscape') {
    [width, height] = [height, width];
  }
  
  return { width, height };
}

/**
 * Find optimal position for a word using spiral search with collision detection
 * @param word WordCloudItem to position
 * @param existingWords Array of already positioned words
 * @param centerX Center X coordinate
 * @param centerY Center Y coordinate
 * @param canvasDimensions Canvas dimensions
 * @returns Position object with x and y coordinates
 */
function findOptimalPosition(
  word: WordCloudItem,
  existingWords: WordCloudItem[],
  centerX: number,
  centerY: number,
  canvasDimensions: { width: number; height: number }
): { x: number; y: number } {
  const wordBounds = getTextBounds(word);
  
  // Try center position first
  if (!hasCollision(word, centerX, centerY, existingWords) && 
      isWithinBounds(centerX, centerY, wordBounds, canvasDimensions)) {
    return { x: centerX, y: centerY };
  }
  
  // Use spiral search to find optimal position
  const maxRadius = Math.max(canvasDimensions.width, canvasDimensions.height) / 2;
  const angleStep = Math.PI / 8; // 22.5 degrees
  const radiusStep = 10;
  
  for (let radius = radiusStep; radius <= maxRadius; radius += radiusStep) {
    const angleSteps = Math.max(8, Math.floor(2 * Math.PI * radius / 50)); // More angles for larger radii
    const currentAngleStep = (2 * Math.PI) / angleSteps;
    
    for (let i = 0; i < angleSteps; i++) {
      const angle = i * currentAngleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (isWithinBounds(x, y, wordBounds, canvasDimensions) && 
          !hasCollision(word, x, y, existingWords)) {
        return { x, y };
      }
    }
  }
  
  // Fallback: place at center even if there's collision
  console.warn(`Could not find collision-free position for word: ${word.text}`);
  return { x: centerX, y: centerY };
}

/**
 * Check if a word at given position collides with existing words
 * @param word WordCloudItem to check
 * @param x X coordinate
 * @param y Y coordinate
 * @param existingWords Array of positioned words
 * @returns Boolean indicating collision
 */
function hasCollision(
  word: WordCloudItem,
  x: number,
  y: number,
  existingWords: WordCloudItem[]
): boolean {
  const wordBounds = getTextBounds(word);
  const padding = 5; // Minimum spacing between words
  
  const wordRect = {
    left: x - wordBounds.width / 2 - padding,
    right: x + wordBounds.width / 2 + padding,
    top: y - wordBounds.height / 2 - padding,
    bottom: y + wordBounds.height / 2 + padding
  };
  
  return existingWords.some(existingWord => {
    if (!existingWord.x || !existingWord.y) return false;
    
    const existingBounds = getTextBounds(existingWord);
    const existingRect = {
      left: existingWord.x - existingBounds.width / 2 - padding,
      right: existingWord.x + existingBounds.width / 2 + padding,
      top: existingWord.y - existingBounds.height / 2 - padding,
      bottom: existingWord.y + existingBounds.height / 2 + padding
    };
    
    // Check rectangle intersection
    return !(wordRect.right < existingRect.left ||
             wordRect.left > existingRect.right ||
             wordRect.bottom < existingRect.top ||
             wordRect.top > existingRect.bottom);
  });
}

/**
 * Check if a word position is within canvas bounds
 * @param x X coordinate
 * @param y Y coordinate
 * @param wordBounds Word dimensions
 * @param canvasDimensions Canvas dimensions
 * @returns Boolean indicating if position is valid
 */
function isWithinBounds(
  x: number,
  y: number,
  wordBounds: { width: number; height: number },
  canvasDimensions: { width: number; height: number }
): boolean {
  const margin = 20; // Margin from canvas edges
  
  return (
    x - wordBounds.width / 2 >= margin &&
    x + wordBounds.width / 2 <= canvasDimensions.width - margin &&
    y - wordBounds.height / 2 >= margin &&
    y + wordBounds.height / 2 <= canvasDimensions.height - margin
  );
}

/**
 * Estimate text bounds for a word (approximate calculation)
 * @param word WordCloudItem
 * @returns Object with width and height
 */
function getTextBounds(word: WordCloudItem): { width: number; height: number } {
  // Approximate character width based on font size and weight
  const baseCharWidth = word.size * 0.6; // Rough approximation
  const weightMultiplier = word.weight >= 700 ? 1.2 : word.weight >= 500 ? 1.1 : 1.0;
  
  const width = word.text.length * baseCharWidth * weightMultiplier;
  const height = word.size * 1.2; // Line height approximation
  
  return { width, height };
}

/**
 * Calculate the bounds of the entire word cloud layout
 * @param words Array of positioned WordCloudItem objects
 * @returns Bounds object with dimensions and coordinates
 */
function calculateLayoutBounds(words: WordCloudItem[]): {
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (words.length === 0) {
    return { width: 0, height: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  words.forEach(word => {
    if (word.x !== undefined && word.y !== undefined) {
      const bounds = getTextBounds(word);
      const left = word.x - bounds.width / 2;
      const right = word.x + bounds.width / 2;
      const top = word.y - bounds.height / 2;
      const bottom = word.y + bounds.height / 2;
      
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