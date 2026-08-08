import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-b border-amber-500/30 py-1.5 text-xs">
      <WifiOff className="h-3.5 w-3.5" />
      Offline — viewing cached receipts. New uploads will fail until you reconnect.
    </div>
  );
}
