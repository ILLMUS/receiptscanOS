import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressAndUploadImage, getReceiptImageUrl } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export interface ReceiptItem {
  name: string;
  qty?: number;
  price: number;
}

export interface ExtractedData {
  store_name: string;
  store_address?: string | null;
  date?: string | null;
  time?: string | null;
  items: ReceiptItem[];
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  payment_method?: string | null;
  receipt_number?: string | null;
  raw_text?: string;
}

export interface Receipt {
  id: string;
  store_name: string | null;
  amount: number | null;
  receipt_date: string | null;
  notes: string | null;
  image_path: string | null;
  image_size_kb: number | null;
  extracted_data: ExtractedData | null;
  category: string | null;
  scope: 'home' | 'business';
  job_id: string | null;
  created_at: string;
}

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading receipts', description: error.message, variant: 'destructive' });
    } else {
      setReceipts((data as unknown as Receipt[]) || []);
    }
    setLoading(false);
  }, [toast]);

  const addReceipt = async (
    file: File,
    storeName: string,
    amount: number | null,
    receiptDate: string,
    notes: string,
    category: string,
    jobId?: string,
    scope: 'home' | 'business' = 'home'
  ): Promise<string | null> => {
    setLoading(true);
    try {
      const { path, sizeKb } = await compressAndUploadImage(file);

      const { data: insertData, error } = await supabase.from('receipts').insert({
        store_name: storeName || null,
        amount,
        receipt_date: receiptDate || new Date().toISOString().split('T')[0],
        notes: notes || null,
        image_path: path,
        image_size_kb: sizeKb,
        user_id: user!.id,
        category: category || null,
        scope,
        job_id: jobId || null,
      }).select('id').single();

      if (error) throw error;

      toast({ title: 'Receipt saved!', description: `Extracting text with AI...` });

      const imageUrl = getReceiptImageUrl(path);
      try {
        const { data: extractResult, error: extractError } = await supabase.functions.invoke('extract-receipt', {
          body: { image_url: imageUrl, receipt_id: insertData.id }
        });
        if (extractError) {
          console.error('Extraction error:', extractError);
          toast({ title: 'Receipt saved', description: 'AI extraction failed, but image is stored.', variant: 'default' });
        } else {
          toast({ title: 'Receipt processed!', description: 'Text extracted and formatted as document.' });
        }
      } catch (extractErr) {
        console.error('Extraction error:', extractErr);
      }

      await fetchReceipts();
      setLoading(false);
      return insertData.id as string;
    } catch (err: any) {
      toast({ title: 'Error saving receipt', description: err.message, variant: 'destructive' });
      setLoading(false);
      return null;
    }
  };

  const updateExtractedData = async (receiptId: string, extractedData: ExtractedData) => {
    const { error } = await supabase.from('receipts').update({
      extracted_data: extractedData as any,
      store_name: extractedData.store_name || null,
      amount: extractedData.total ?? null,
    }).eq('id', receiptId);

    if (error) {
      toast({ title: 'Error updating receipt', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Receipt updated!' });
      await fetchReceipts();
    }
  };

  const reExtract = async (receipt: Receipt) => {
    if (!receipt.image_path) {
      toast({ title: 'No image', description: 'This receipt has no image to re-extract from.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const imageUrl = getReceiptImageUrl(receipt.image_path);
      toast({ title: 'Re-extracting...', description: 'Running AI extraction again.' });
      const { error: extractError } = await supabase.functions.invoke('extract-receipt', {
        body: { image_url: imageUrl, receipt_id: receipt.id }
      });
      if (extractError) throw extractError;
      toast({ title: 'Re-extraction complete!', description: 'Receipt data has been updated.' });
      await fetchReceipts();
    } catch (err: any) {
      toast({ title: 'Re-extraction failed', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const deleteReceipt = async (receipt: Receipt) => {
    if (receipt.image_path) {
      await supabase.storage.from('receipts').remove([receipt.image_path]);
    }
    const { error } = await supabase.from('receipts').delete().eq('id', receipt.id);
    if (error) {
      toast({ title: 'Error deleting receipt', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Receipt deleted' });
      await fetchReceipts();
    }
  };

  const findDuplicate = useCallback(
    (storeName: string, amount: number | null, date: string): Receipt | null => {
      if (!storeName || amount == null || !date) return null;
      const normStore = storeName.trim().toLowerCase();
      const match = receipts.find((r) => {
        if (!r.store_name || r.amount == null || !r.receipt_date) return false;
        if (r.store_name.trim().toLowerCase() !== normStore) return false;
        if (Math.abs(Number(r.amount) - amount) > 0.01) return false;
        return r.receipt_date === date;
      });
      return match || null;
    },
    [receipts]
  );

  const assignJob = async (receiptId: string, jobId: string | null) => {
    const { error } = await supabase.from('receipts').update({ job_id: jobId }).eq('id', receiptId);
    if (error) {
      toast({ title: 'Error tagging job', description: error.message, variant: 'destructive' });
    } else {
      setReceipts((prev) => prev.map((r) => (r.id === receiptId ? { ...r, job_id: jobId } : r)));
      toast({ title: jobId ? 'Receipt tagged to job' : 'Job tag removed' });
    }
  };

  const setScope = async (receiptId: string, scope: 'home' | 'business') => {
    const { error } = await supabase.from('receipts').update({ scope }).eq('id', receiptId);
    if (error) {
      toast({ title: 'Error updating receipt', description: error.message, variant: 'destructive' });
    } else {
      setReceipts((prev) => prev.map((r) => (r.id === receiptId ? { ...r, scope } : r)));
    }
  };

  return { receipts, loading, fetchReceipts, setScope, addReceipt, deleteReceipt, updateExtractedData, reExtract, getReceiptImageUrl, findDuplicate, assignJob };
}

