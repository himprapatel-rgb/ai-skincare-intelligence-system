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

function canvasToResult(canvas: HTMLCanvasElement): SegmentationResult {
  const dataUrl = canvas.toDataURL("image/png");
  return {
    dataUrl,
    blob: dataUrlToBlob(dataUrl),
  };
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

export async function removeBackground(dataUrl: string): Promise<SegmentationResult> {
  const image = await loadImageFromDataUrl(dataUrl);
  const segmenter = await getSegmenter();

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = image.width;
  maskCanvas.height = image.height;

  const result = await new Promise<SegmentationResult>((resolve, reject) => {
    segmenter.onResults((results) => {
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = image.width;
      outputCanvas.height = image.height;
      const ctx = outputCanvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to create segmentation canvas."));
        return;
      }
      ctx.drawImage(image, 0, 0, outputCanvas.width, outputCanvas.height);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(results.segmentationMask, 0, 0, outputCanvas.width, outputCanvas.height);
      resolve(canvasToResult(outputCanvas));
    });
    segmenter.send({ image }).catch(reject);
  });

  return result;
}
