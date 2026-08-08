import { useCallback, useEffect, useState } from 'react';

export type AppMode = 'all' | 'home' | 'business';

const KEY = 'receipt-app-mode';

/**
 * Home / Business / All view mode. Purely a presentation filter — it never
 * changes stored data, so switching modes can't put receipts into conflict.
 */
export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    return saved === 'home' || saved === 'business' || saved === 'all' ? saved : 'all';
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setModeState(e.newValue as AppMode);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    window.localStorage.setItem(KEY, m);
  }, []);

  return { mode, setMode };
}
