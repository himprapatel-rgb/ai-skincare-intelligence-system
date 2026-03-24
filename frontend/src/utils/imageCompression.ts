// imageCompression — Canvas-based JPEG compression targeting max file size

const DEFAULT_MAX_BYTES = 200 * 1024; // 200KB
const QUALITY_STEPS = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
const MAX_DIMENSION = 1920;

interface CompressionResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  quality: number;
}

/**
 * Compress an image file/blob to JPEG under a target size.
 * Uses progressive quality reduction until the target is met.
 */
export async function compressImage(
  input: File | Blob,
  maxBytes: number = DEFAULT_MAX_BYTES
): Promise<CompressionResult> {
  const originalSize = input.size;

  // If already under limit, return as-is
  if (originalSize <= maxBytes) {
    const dims = await getImageDimensions(input);
    return {
      blob: input,
      width: dims.width,
      height: dims.height,
      originalSize,
      compressedSize: originalSize,
      quality: 1,
    };
  }

  const bitmap = await createImageBitmap(input);
  let { width, height } = bitmap;

  // Scale down if larger than max dimension
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context for compression');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Try progressively lower quality
  let resultBlob: Blob | null = null;
  let usedQuality = 1;

  for (const quality of QUALITY_STEPS) {
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    if (blob.size <= maxBytes) {
      resultBlob = blob;
      usedQuality = quality;
      break;
    }
    // Keep the last attempt even if over limit
    resultBlob = blob;
    usedQuality = quality;
  }

  if (!resultBlob) {
    throw new Error('Image compression failed');
  }

  return {
    blob: resultBlob,
    width,
    height,
    originalSize,
    compressedSize: resultBlob.size,
    quality: usedQuality,
  };
}

async function getImageDimensions(input: File | Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(input);
  const { width, height } = bitmap;
  bitmap.close();
  return { width, height };
}
