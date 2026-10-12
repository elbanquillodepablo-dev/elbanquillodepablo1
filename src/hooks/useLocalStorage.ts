import { useEffect, useState } from 'react';

/** Estado sincronizado con localStorage, tolerante a modo privado / almacenamiento bloqueado. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* almacenamiento no disponible: se mantiene en memoria */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
