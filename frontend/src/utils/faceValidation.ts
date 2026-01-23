import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs";

type FaceValidationResult = {
  croppedBlob: Blob;
  previewUrl: string;
};

type ValidationError =
  | "no_face"
  | "multiple_faces"
  | "face_too_small"
  | "face_off_center"
  | "face_angle"
  | "landmarks_missing"
  | "image_blurry"
  | "lighting_low"
  | "lighting_high"
  | "low_contrast";

const MODEL_OPTIONS = {
  maxFaces: 2,
  inputWidth: 128,
  inputHeight: 128,
  iouThreshold: 0.3,
  scoreThreshold: 0.75,
};

let modelPromise: Promise<blazeface.BlazeFaceModel> | null = null;

async function loadModel(): Promise<blazeface.BlazeFaceModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      await tf.ready();
      return blazeface.load(MODEL_OPTIONS);
    })();
  }
  return modelPromise;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image."));
    };
    img.src = url;
  });
}

function analyzeImageQuality(image: HTMLImageElement): ValidationError | null {
  const canvas = document.createElement("canvas");
  const maxSide = 160;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let sum = 0;
  let sumSq = 0;
  const gray = new Float32Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const value = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[j] = value;
    sum += value;
    sumSq += value * value;
  }

  const count = gray.length;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  const stdDev = Math.sqrt(Math.max(0, variance));

  if (mean < 70) {
    return "lighting_low";
  }
  if (mean > 200) {
    return "lighting_high";
  }
  if (stdDev < 22) {
    return "low_contrast";
  }

  let laplacianSum = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;
      const center = gray[idx];
      const laplacian =
        4 * center -
        gray[idx - 1] -
        gray[idx + 1] -
        gray[idx - width] -
        gray[idx + width];
      laplacianSum += Math.abs(laplacian);
    }
  }

  const laplacianAvg = laplacianSum / count;
  if (laplacianAvg < 12) {
    return "image_blurry";
  }

  return null;
}

function createOvalCrop(
  source: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number }
): { blob: Blob; dataUrl: string } {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(crop.width);
  canvas.height = Math.round(crop.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to prepare canvas.");
  }

  ctx.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();
  ctx.ellipse(
    crop.width / 2,
    crop.height / 2,
    crop.width * 0.45,
    crop.height * 0.6,
    0,
    0,
    Math.PI * 2
  );
  ctx.closePath();
  ctx.fill();

  const dataUrl = canvas.toDataURL("image/png");
  const blob = dataUrlToBlob(dataUrl);
  return { blob, dataUrl };
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

function validateFaceGeometry(
  imgWidth: number,
  imgHeight: number,
  faceBox: { x: number; y: number; width: number; height: number },
  landmarks: number[][]
): ValidationError | null {
  if (landmarks.length < 3) {
    return "landmarks_missing";
  }

  const faceArea = faceBox.width * faceBox.height;
  const imageArea = imgWidth * imgHeight;
  const areaRatio = faceArea / imageArea;
  const minSideRatio = Math.min(
    faceBox.width / imgWidth,
    faceBox.height / imgHeight
  );

  if (areaRatio < 0.22 || minSideRatio < 0.35) {
    return "face_too_small";
  }

  const centerX = faceBox.x + faceBox.width / 2;
  const centerY = faceBox.y + faceBox.height / 2;
  const offsetX = Math.abs(centerX / imgWidth - 0.5);
  const offsetY = Math.abs(centerY / imgHeight - 0.5);
  if (offsetX > 0.2 || offsetY > 0.2) {
    return "face_off_center";
  }

  const rightEye = landmarks[0];
  const leftEye = landmarks[1];
  const nose = landmarks[2];
  const eyeDx = leftEye[0] - rightEye[0];
  const eyeDy = leftEye[1] - rightEye[1];
  const eyeDistance = Math.hypot(eyeDx, eyeDy);

  if (eyeDistance <= 0) {
    return "landmarks_missing";
  }

  const roll = Math.abs(eyeDy / eyeDistance);
  if (roll > 0.15) {
    return "face_angle";
  }

  const leftToNose = Math.abs(nose[0] - leftEye[0]);
  const rightToNose = Math.abs(rightEye[0] - nose[0]);
  const yawRatio = Math.abs(leftToNose - rightToNose) / eyeDistance;
  if (yawRatio > 0.35) {
    return "face_angle";
  }

  return null;
}

function normalizeLandmarks(raw: unknown): number[][] {
  if (!raw) {
    return [];
  }
  if (raw instanceof tf.Tensor) {
    return raw.arraySync() as number[][];
  }
  if (Array.isArray(raw)) {
    return raw as number[][];
  }
  return [];
}

export async function validateAndCropFace(
  file: File
): Promise<FaceValidationResult> {
  const image = await loadImageFromFile(file);
  const qualityError = analyzeImageQuality(image);
  if (qualityError) {
    throw new Error(qualityError);
  }
  const model = await loadModel();
  const predictions = await model.estimateFaces(image, false);

  if (predictions.length === 0) {
    throw new Error("no_face");
  }
  if (predictions.length > 1) {
    throw new Error("multiple_faces");
  }

  const face = predictions[0];
  const topLeft = face.topLeft as [number, number];
  const bottomRight = face.bottomRight as [number, number];
  const width = bottomRight[0] - topLeft[0];
  const height = bottomRight[1] - topLeft[1];

  const validationError = validateFaceGeometry(
    image.width,
    image.height,
    { x: topLeft[0], y: topLeft[1], width, height },
    normalizeLandmarks(face.landmarks)
  );
  if (validationError) {
    throw new Error(validationError);
  }

  const padding = 0.2;
  const paddedWidth = width * (1 + padding);
  const paddedHeight = height * (1 + padding);
  const paddedX = Math.max(topLeft[0] - width * padding * 0.5, 0);
  const paddedY = Math.max(topLeft[1] - height * padding * 0.6, 0);

  const cropWidth = Math.min(paddedWidth, image.width - paddedX);
  const cropHeight = Math.min(paddedHeight, image.height - paddedY);

  const { blob, dataUrl } = createOvalCrop(image, {
    x: paddedX,
    y: paddedY,
    width: cropWidth,
    height: cropHeight,
  });

  return { croppedBlob: blob, previewUrl: dataUrl };
}
