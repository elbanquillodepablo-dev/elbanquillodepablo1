import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useCategories } from '@/hooks/queries';
import { deleteCategory, upsertCategory } from '@/services/catalog';
import { errorMessage, useToast } from '@/context/ToastContext';
import { cn, slugify } from '@/lib/format';
import type { Category } from '@/types';
import { AdminTitle } from './AdminLayout';

export default function CategoriesPage() {
  const { data: categories = [] } = useCategories(true);
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const refresh = () => qc.invalidateQueries({ queryKey: ['categories'] });

  const run = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      refresh();
      toast(ok);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    run(async () => {
      await upsertCategory({ name: name.trim(), slug: slugify(name), description: description || null, sort_order: categories.length + 1 });
      setName('');
      setDescription('');
    }, 'Categoría creada');
  };

  const save = (c: Category, patch: Partial<Category>) => run(() => upsertCategory({ ...c, ...patch }), 'Guardado');

  return (
    <>
      <AdminTitle title="Categorías" />
      <form onSubmit={onCreate} className="mb-6 flex flex-wrap gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
        <input className="input max-w-xs flex-1" placeholder="Nombre (ej. Liga BetPlay)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre" />
        <input className="input max-w-md flex-[2]" placeholder="Descripción corta" value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Descripción" />
        <button className="btn-primary"><Plus className="size-4" /> Agregar</button>
      </form>

      <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
        {categories.map((c) => (
          <li key={c.id} className={cn('flex flex-wrap items-center gap-3 p-4', !c.is_active && 'opacity-55')}>
            <input type="number" className="input w-20" defaultValue={c.sort_order} aria-label="Orden"
              onBlur={(e) => Number(e.target.value) !== c.sort_order && save(c, { sort_order: Number(e.target.value) })} />
            <div className="min-w-0 flex-1">
              <input className="input h-9 font-bold" defaultValue={c.name} aria-label="Nombre"
                onBlur={(e) => e.target.value !== c.name && save(c, { name: e.target.value })} />
              <p className="mt-1 text-xs text-mute">/{c.slug}</p>
            </div>
            <button onClick={() => save(c, { is_active: !c.is_active })} aria-label={c.is_active ? 'Ocultar' : 'Mostrar'} className="grid size-9 place-items-center rounded-full hover:bg-surface-2">
              {c.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
            <button
              onClick={() => confirm(`¿Eliminar "${c.name}"? Los productos quedarán sin categoría.`) && run(() => deleteCategory(c.id), 'Categoría eliminada')}
              aria-label="Eliminar" className="grid size-9 place-items-center rounded-full text-card hover:bg-card/10"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
