import { useRef, useState, type DragEvent } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { deleteProductImage, reorderImages, uploadProductImage } from '@/services/images';
import { formatBytes } from '@/lib/imageOptimizer';
import { errorMessage, useToast } from '@/context/ToastContext';
import { ProductImage } from '@/components/product/ProductImage';
import { cn } from '@/lib/format';
import type { ProductImage as TImage } from '@/types';

interface Props {
  productId: string;
  productName: string;
  images: TImage[];
  onChange: () => void;
}

/** Subida múltiple con optimización automática (WebP + miniatura), orden y borrado. */
export function ImageManager({ productId, productName, images, onChange }: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [savings, setSavings] = useState<{ before: number; after: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!list.length) return;
    setProgress({ done: 0, total: list.length });
    let before = 0;
    let after = 0;
    // en serie: evita picos de memoria en celulares al procesar fotos grandes
    for (const [i, file] of list.entries()) {
      try {
        const r = await uploadProductImage(productId, file, images.length + i, productName);
        before += r.originalBytes;
        after += r.optimizedBytes;
      } catch (e) {
        toast(`${file.name}: ${errorMessage(e)}`, 'error');
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    if (before) {
      setSavings({ before, after });
      toast(`Fotos optimizadas: ${formatBytes(before)} → ${formatBytes(after)}`);
    }
    onChange();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    try {
      await reorderImages(next);
      onChange();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const remove = async (img: TImage) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await deleteProductImage(img);
      onChange();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <figure key={img.id} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-2">
            <ProductImage image={img} alt={img.alt ?? ''} />
            {i === 0 && <span className="chip absolute left-2 top-2 bg-volt text-ink">Portada</span>}
            <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <div className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Mover antes" className="grid size-8 place-items-center rounded-full bg-ink/70 disabled:opacity-30"><ArrowLeft className="size-4" /></button>
                <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label="Mover después" className="grid size-8 place-items-center rounded-full bg-ink/70 disabled:opacity-30"><ArrowRight className="size-4" /></button>
              </div>
              <button type="button" onClick={() => remove(img)} aria-label="Eliminar foto" className="grid size-8 place-items-center rounded-full bg-card text-white"><Trash2 className="size-4" /></button>
            </div>
          </figure>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={!!progress}
          className={cn(
            'flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center text-xs font-bold transition',
            dragging ? 'border-volt bg-volt/5' : 'border-line hover:border-line-strong',
          )}
        >
          {progress ? (
            <>
              <Loader2 className="size-6 animate-spin text-volt" />
              Optimizando {progress.done}/{progress.total}
            </>
          ) : (
            <>
              <ImagePlus className="size-6 text-volt" />
              Subir fotos
              <span className="font-medium text-mute">o arrástralas aquí</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) upload(e.target.files);
          e.target.value = '';
        }}
      />

      <p className="text-xs text-mute">
        Las fotos se convierten automáticamente a WebP (máx. 1600 px) y se crea una miniatura de 640 px. La primera foto es la portada.
        {savings && (
          <strong className="ml-1 text-volt">
            Última subida: {formatBytes(savings.before)} → {formatBytes(savings.after)} ({Math.round((1 - savings.after / savings.before) * 100)}% menos).
          </strong>
        )}
      </p>
    </div>
  );
}
