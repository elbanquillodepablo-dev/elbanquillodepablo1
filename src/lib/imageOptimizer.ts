/**
 * Optimizador de imágenes en el navegador (antes de subir a Supabase).
 *
 * - Corrige la orientación EXIF (fotos de celular giradas).
 * - Reduce a un tamaño máximo (1600px "full" y 640px "thumb") con
 *   reescalado por pasos para evitar dientes de sierra y mantener nitidez.
 * - Convierte a WebP (≈ 70–95 % menos peso que un JPG/PNG de cámara) con
 *   calidad alta. Si el navegador no sabe codificar WebP, usa JPEG.
 * - Elimina metadatos (GPS, cámara…) porque se re-codifica desde el canvas.
 *
 * Resultado típico: foto de celular de 4–8 MB  →  ~150–350 KB (full) + ~30–60 KB (thumb).
 */

export interface OptimizedImage {
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
  extension: 'webp' | 'jpg';
  originalBytes: number;
  optimizedBytes: number;
}

export interface OptimizeOptions {
  maxSize?: number;
  thumbSize?: number;
  quality?: number;
  thumbQuality?: number;
}

const DEFAULTS: Required<OptimizeOptions> = {
  maxSize: 1600,
  thumbSize: 640,
  quality: 0.82,
  thumbQuality: 0.78,
};

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return 'Usa una imagen JPG, PNG, WebP, AVIF o HEIC. No se admiten SVG ni GIF.';
  if (!file.size) return 'La imagen está vacía.';
  if (file.size > MAX_INPUT_BYTES) return 'La imagen supera 25 MB.';
  return null;
}

let webpSupport: boolean | null = null;
async function supportsWebpEncode(): Promise<boolean> {
  if (webpSupport !== null) return webpSupport;
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const blob = await canvasToBlob(c, 'image/webp', 0.8);
  webpSupport = blob.type === 'image/webp';
  return webpSupport;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo codificar la imagen'))), type, quality),
  );
}

function fit(w: number, h: number, max: number) {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/** Reduce quality, then dimensions if needed, to keep a predictable download budget. */
async function encodeWithinBudget(canvas: HTMLCanvasElement, type: string, quality: number, budget: number): Promise<Blob> {
  let current = canvas;
  let blob = await canvasToBlob(current, type, quality);
  for (let q = quality - 0.08; blob.size > budget && q >= 0.58; q -= 0.08) {
    blob = await canvasToBlob(current, type, q);
  }
  while (blob.size > budget && Math.max(current.width, current.height) > 480) {
    const dims = fit(current.width, current.height, Math.floor(Math.max(current.width, current.height) * 0.8));
    const smaller = resize(current, current.width, current.height, dims.width, dims.height);
    if (current !== canvas) { current.width = current.height = 0; }
    current = smaller;
    blob = await canvasToBlob(current, type, 0.72);
  }
  // Keep dimensions accurate for responsive image selection.
  if (current !== canvas) {
    canvas.width = current.width; canvas.height = current.height;
    canvas.getContext('2d')!.drawImage(current, 0, 0);
    current.width = current.height = 0;
  }
  return blob;
}

/** Reescala a la mitad repetidamente hasta acercarse al destino: más nítido que un solo salto. */
function resize(source: CanvasImageSource, srcW: number, srcH: number, dstW: number, dstH: number) {
  let curW = srcW;
  let curH = srcH;
  let current: CanvasImageSource = source;

  while (curW / 2 >= dstW && curH / 2 >= dstH) {
    const step = document.createElement('canvas');
    step.width = Math.round(curW / 2);
    step.height = Math.round(curH / 2);
    const ctx = step.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(current, 0, 0, step.width, step.height);
    current = step;
    curW = step.width;
    curH = step.height;
  }

  const out = document.createElement('canvas');
  out.width = dstW;
  out.height = dstH;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(current, 0, 0, dstW, dstH);
  return out;
}

export async function optimizeImage(file: File, options: OptimizeOptions = {}): Promise<OptimizedImage> {
  const opts = { ...DEFAULTS, ...options };
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Formato no soportado por este navegador (si es HEIC, expórtala como JPG).');
  }

  if (bitmap.width * bitmap.height > 48_000_000) {
    bitmap.close();
    throw new Error('La foto supera 48 megapíxeles. Expórtala con menor resolución.');
  }

  const useWebp = await supportsWebpEncode();
  const mime = useWebp ? 'image/webp' : 'image/jpeg';

  const fullDims = fit(bitmap.width, bitmap.height, opts.maxSize);
  const thumbDims = fit(bitmap.width, bitmap.height, opts.thumbSize);

  const fullCanvas = resize(bitmap, bitmap.width, bitmap.height, fullDims.width, fullDims.height);
  // la miniatura parte del canvas ya reducido: más rápido y mismo resultado
  const thumbCanvas = resize(fullCanvas, fullDims.width, fullDims.height, thumbDims.width, thumbDims.height);
  bitmap.close();

  const [full, thumb] = await Promise.all([
    encodeWithinBudget(fullCanvas, mime, opts.quality, 350 * 1024),
    encodeWithinBudget(thumbCanvas, mime, opts.thumbQuality, 80 * 1024),
  ]);

  return {
    full,
    thumb,
    width: fullCanvas.width,
    height: fullCanvas.height,
    extension: useWebp ? 'webp' : 'jpg',
    originalBytes: file.size,
    optimizedBytes: full.size + thumb.size,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
