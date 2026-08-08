
-- Add user_id column
ALTER TABLE public.receipts ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policy
DROP POLICY IF EXISTS "Allow all access to receipts" ON public.receipts;

-- Create user-scoped policies
CREATE POLICY "Users can view own receipts"
  ON public.receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own receipts"
  ON public.receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON public.receipts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts"
  ON public.receipts FOR DELETE
  USING (auth.uid() = user_id);

-- Update storage policies to be user-scoped
DROP POLICY IF EXISTS "Allow public insert access on receipts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access on receipts bucket" ON storage.objects;

CREATE POLICY "Users can upload receipt images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete receipt images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');
