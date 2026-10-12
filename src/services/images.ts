import { supabase, PRODUCTS_BUCKET } from '@/lib/supabase';
import { optimizeImage } from '@/lib/imageOptimizer';
import type { ProductImage } from '@/types';

const ONE_YEAR = '31536000';

/** Optimiza (WebP + miniatura) y sube una imagen; registra la fila en product_images. */
export async function uploadProductImage(
  productId: string,
  file: File,
  position: number,
  alt: string,
): Promise<{ image: ProductImage; originalBytes: number; optimizedBytes: number }> {
  const opt = await optimizeImage(file);
  const id = crypto.randomUUID();
  const base = `${productId}/${id}`;
  const fullPath = `${base}.${opt.extension}`;
  const thumbPath = `${base}-thumb.${opt.extension}`;
  const contentType = opt.full.type;

  const bucket = supabase.storage.from(PRODUCTS_BUCKET);
  // nombres únicos e inmutables => caché de 1 año en el CDN
  const [a, b] = await Promise.all([
    bucket.upload(fullPath, opt.full, { contentType, cacheControl: ONE_YEAR }),
    bucket.upload(thumbPath, opt.thumb, { contentType, cacheControl: ONE_YEAR }),
  ]);
  if (a.error || b.error) {
    await bucket.remove([fullPath, thumbPath]);
    throw a.error ?? b.error;
  }

  const { data, error } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      path: fullPath,
      thumb_path: thumbPath,
      alt,
      width: opt.width,
      height: opt.height,
      position,
    })
    .select()
    .single();
  if (error) {
    await bucket.remove([fullPath, thumbPath]);
    throw error;
  }
  return { image: data as ProductImage, originalBytes: opt.originalBytes, optimizedBytes: opt.optimizedBytes };
}

export async function deleteProductImage(image: ProductImage): Promise<void> {
  const paths = [image.path, image.thumb_path].filter(Boolean) as string[];
  await supabase.storage.from(PRODUCTS_BUCKET).remove(paths);
  const { error } = await supabase.from('product_images').delete().eq('id', image.id);
  if (error) throw error;
}

/** Guarda el nuevo orden de las imágenes (la primera es la portada). */
export async function reorderImages(images: ProductImage[]): Promise<void> {
  const results = await Promise.all(
    images.map((img, position) => supabase.from('product_images').update({ position }).eq('id', img.id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
