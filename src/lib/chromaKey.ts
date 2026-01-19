// Chroma Key Processing Engine - All client-side Canvas API processing

export interface ChromaKeySettings {
  targetColor: { r: number; g: number; b: number };
  tolerance: number; // 0-100
  edgeSmoothing: number; // 0-20
  fillMode: 'transparent' | 'replacement';
  replacementColor: { r: number; g: number; b: number };
  selectionMode: 'all' | 'outer';
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Euclidean distance in RGB space
function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

// Maximum possible distance in RGB space
const MAX_RGB_DISTANCE = Math.sqrt(255 * 255 * 3); // ~441.67

function isColorMatch(
  r: number, g: number, b: number,
  target: { r: number; g: number; b: number },
  tolerance: number
): boolean {
  const distance = colorDistance(r, g, b, target.r, target.g, target.b);
  const threshold = (tolerance / 100) * MAX_RGB_DISTANCE;
  return distance <= threshold;
}

// Get match strength for edge smoothing (0 = no match, 1 = perfect match)
function getMatchStrength(
  r: number, g: number, b: number,
  target: { r: number; g: number; b: number },
  tolerance: number
): number {
  const distance = colorDistance(r, g, b, target.r, target.g, target.b);
  const threshold = (tolerance / 100) * MAX_RGB_DISTANCE;
  
  if (distance > threshold) return 0;
  return 1 - (distance / threshold);
}

// Flood fill from edges to find outer contiguous regions
function findOuterContiguousPixels(
  imageData: ImageData,
  target: { r: number; g: number; b: number },
  tolerance: number
): Set<number> {
  const { width, height, data } = imageData;
  const visited = new Set<number>();
  const toRemove = new Set<number>();
  const queue: number[] = [];

  // Start from all edge pixels that match the target color
  for (let x = 0; x < width; x++) {
    // Top edge
    queue.push(x);
    // Bottom edge
    queue.push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    // Left edge
    queue.push(y * width);
    // Right edge
    queue.push(y * width + (width - 1));
  }

  while (queue.length > 0) {
    const pixelIndex = queue.shift()!;
    
    if (visited.has(pixelIndex)) continue;
    visited.add(pixelIndex);

    const dataIndex = pixelIndex * 4;
    const r = data[dataIndex];
    const g = data[dataIndex + 1];
    const b = data[dataIndex + 2];

    if (!isColorMatch(r, g, b, target, tolerance)) continue;

    toRemove.add(pixelIndex);

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    // Check 4-connected neighbors
    const neighbors = [
      x > 0 ? pixelIndex - 1 : -1,           // left
      x < width - 1 ? pixelIndex + 1 : -1,   // right
      y > 0 ? pixelIndex - width : -1,        // up
      y < height - 1 ? pixelIndex + width : -1 // down
    ];

    for (const neighbor of neighbors) {
      if (neighbor >= 0 && !visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return toRemove;
}

// Apply edge smoothing using a blur-like approach
function applyEdgeSmoothing(
  result: ImageData,
  original: ImageData,
  removedPixels: Set<number>,
  smoothingRadius: number
): void {
  if (smoothingRadius === 0) return;

  const { width, height } = result;
  const tempAlpha = new Float32Array(width * height);
  
  // Copy current alpha values
  for (let i = 0; i < width * height; i++) {
    tempAlpha[i] = result.data[i * 4 + 3];
  }

  // Find edge pixels (removed pixels next to non-removed)
  const edgePixels = new Set<number>();
  removedPixels.forEach(pixelIndex => {
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    
    const neighbors = [
      x > 0 ? pixelIndex - 1 : -1,
      x < width - 1 ? pixelIndex + 1 : -1,
      y > 0 ? pixelIndex - width : -1,
      y < height - 1 ? pixelIndex + width : -1
    ];

    for (const neighbor of neighbors) {
      if (neighbor >= 0 && !removedPixels.has(neighbor)) {
        edgePixels.add(neighbor);
      }
    }
  });

  // Apply gradual fade to pixels near edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      
      if (removedPixels.has(pixelIndex)) continue;

      // Check distance to nearest removed pixel
      let minDistance = smoothingRadius + 1;
      
      for (let dy = -smoothingRadius; dy <= smoothingRadius; dy++) {
        for (let dx = -smoothingRadius; dx <= smoothingRadius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          
          const neighborIndex = ny * width + nx;
          if (removedPixels.has(neighborIndex)) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            minDistance = Math.min(minDistance, dist);
          }
        }
      }

      if (minDistance <= smoothingRadius) {
        const fadeAmount = minDistance / smoothingRadius;
        const dataIndex = pixelIndex * 4;
        result.data[dataIndex + 3] = Math.round(tempAlpha[pixelIndex] * fadeAmount);
      }
    }
  }
}

export function processChromaKey(
  sourceCanvas: HTMLCanvasElement,
  settings: ChromaKeySettings
): ImageData {
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true })!;
  const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  const { targetColor, tolerance, edgeSmoothing, fillMode, replacementColor, selectionMode } = settings;

  let pixelsToRemove: Set<number>;

  if (selectionMode === 'outer') {
    pixelsToRemove = findOuterContiguousPixels(imageData, targetColor, tolerance);
  } else {
    pixelsToRemove = new Set<number>();
    for (let i = 0; i < imageData.data.length / 4; i++) {
      const dataIndex = i * 4;
      const r = imageData.data[dataIndex];
      const g = imageData.data[dataIndex + 1];
      const b = imageData.data[dataIndex + 2];

      if (isColorMatch(r, g, b, targetColor, tolerance)) {
        pixelsToRemove.add(i);
      }
    }
  }

  // Apply removal
  pixelsToRemove.forEach(pixelIndex => {
    const dataIndex = pixelIndex * 4;
    
    if (fillMode === 'transparent') {
      result.data[dataIndex + 3] = 0; // Set alpha to 0
    } else {
      result.data[dataIndex] = replacementColor.r;
      result.data[dataIndex + 1] = replacementColor.g;
      result.data[dataIndex + 2] = replacementColor.b;
      result.data[dataIndex + 3] = 255;
    }
  });

  // Apply edge smoothing
  if (edgeSmoothing > 0 && fillMode === 'transparent') {
    applyEdgeSmoothing(result, imageData, pixelsToRemove, edgeSmoothing);
  }

  return result;
}

export function getColorAtPosition(
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): { r: number; g: number; b: number } | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const pixel = ctx.getImageData(x, y, 1, 1).data;
  return { r: pixel[0], g: pixel[1], b: pixel[2] };
}

export function isValidHex(hex: string): boolean {
  return /^#?([a-f\d]{6})$/i.test(hex);
}
