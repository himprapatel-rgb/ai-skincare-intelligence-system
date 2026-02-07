/**
 * Background removal using MediaPipe Selfie Segmentation.
 * Produces a clean transparent background by using the segmentation mask
 * as the image alpha (person = opaque, background = transparent).
 */
type SegmentationResult = {
  blob: Blob;
  dataUrl: string;
};

type SelfieSegmentationType = {
  setOptions: (options: { modelSelection: number }) => void;
  onResults: (callback: (results: { segmentationMask: HTMLCanvasElement | HTMLImageElement }) => void) => void;
  send: (params: { image: HTMLImageElement }) => Promise<void>;
};

declare global {
  interface Window {
    SelfieSegmentation?: new (config: { locateFile: (file: string) => string }) => SelfieSegmentationType;
  }
}

const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/";

/** Threshold below which mask is treated as background (0 alpha). Reduces noise. */
const MASK_THRESHOLD = 12;

/** Feather radius for alpha channel (soft edge). 0 = sharp, 1–2 = softer. */
const FEATHER_RADIUS = 1;

let segmenterPromise: Promise<SelfieSegmentationType> | null = null;

async function loadSegmentationScript(): Promise<void> {
  if (window.SelfieSegmentation) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load selfie segmentation script."));
    document.head.appendChild(script);
  });
}

async function getSegmenter(): Promise<SelfieSegmentationType> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      await loadSegmentationScript();
      if (!window.SelfieSegmentation) {
        throw new Error("Selfie segmentation not available.");
      }
      const segmenter = new window.SelfieSegmentation({
        locateFile: (file) => `${WASM_BASE}${file}`,
      });
      // 1 = general model (better for selfies), 0 = landscape
      segmenter.setOptions({ modelSelection: 1 });
      return segmenter;
    })();
  }
  return segmenterPromise;
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image for segmentation."));
    img.src = dataUrl;
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const byteString = atob(parts[1]);
  const mimeString = parts[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uintArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i += 1) {
    uintArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: mimeString });
}

/**
 * Apply mask luminance as alpha so background is truly transparent.
 * MediaPipe returns a grayscale mask (person=white, background=black); we use
 * that as the alpha channel so destination-in would require the mask to have
 * alpha, which the drawn mask doesn't provide.
 */
function applyMaskAsAlpha(
  image: HTMLImageElement,
  maskSource: HTMLCanvasElement | HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context.");

  // Draw mask at full image size (MediaPipe may return 256x256)
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("Failed to create mask context.");
  maskCtx.drawImage(maskSource, 0, 0, width, height);
  const maskData = maskCtx.getImageData(0, 0, width, height);

  // Draw original image and get pixel data
  ctx.drawImage(image, 0, 0, width, height);
  const outData = ctx.getImageData(0, 0, width, height);

  const w = width;
  const h = height;
  const alphaChannel = new Uint8Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const mi = i * 4;
    const r = maskData.data[mi];
    const g = maskData.data[mi + 1];
    const b = maskData.data[mi + 2];
    const luminance = Math.round((r + g + b) / 3);
    const alpha = luminance <= MASK_THRESHOLD ? 0 : luminance;
    alphaChannel[i] = alpha;
    outData.data[mi + 3] = alpha;
  }

  if (FEATHER_RADIUS > 0) {
    featherAlpha(outData.data, alphaChannel, w, h, FEATHER_RADIUS);
    for (let i = 0; i < w * h; i++) outData.data[i * 4 + 3] = alphaChannel[i];
  }

  ctx.putImageData(outData, 0, 0);
  return outputCanvas;
}

/**
 * Simple box blur on the alpha channel only for softer edges.
 */
function featherAlpha(
  rgba: Uint8ClampedArray,
  alphaOut: Uint8Array,
  w: number,
  h: number,
  radius: number
): void {
  const r = Math.max(1, Math.floor(radius));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            sum += rgba[(ny * w + nx) * 4 + 3];
            count++;
          }
        }
      }
      alphaOut[y * w + x] = Math.round(sum / count);
    }
  }
}

export async function removeBackground(dataUrl: string): Promise<SegmentationResult> {
  const image = await loadImageFromDataUrl(dataUrl);
  const segmenter = await getSegmenter();

  const result = await new Promise<SegmentationResult>((resolve, reject) => {
    segmenter.onResults((results) => {
      try {
        const outputCanvas = applyMaskAsAlpha(
          image,
          results.segmentationMask,
          image.width,
          image.height
        );
        const outDataUrl = outputCanvas.toDataURL("image/png");
        resolve({
          dataUrl: outDataUrl,
          blob: dataUrlToBlob(outDataUrl),
        });
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Background removal failed."));
      }
    });
    segmenter.send({ image }).catch(reject);
  });

  return result;
}
