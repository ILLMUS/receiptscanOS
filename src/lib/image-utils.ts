import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';

export async function compressAndUploadImage(file: File): Promise<{ path: string; sizeKb: number }> {
  const options = {
    maxSizeMB: 0.1, // Target ~100KB
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.6,
  };

  const compressed = await imageCompression(file, options);
  const sizeKb = Math.round((compressed.size / 1024) * 10) / 10;

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage
    .from('receipts')
    .upload(fileName, compressed, { contentType: 'image/jpeg' });

  if (error) throw error;

  return { path: fileName, sizeKb };
}

export function getReceiptImageUrl(path: string): string {
  const { data } = supabase.storage.from('receipts').getPublicUrl(path);
  return data.publicUrl;
}
