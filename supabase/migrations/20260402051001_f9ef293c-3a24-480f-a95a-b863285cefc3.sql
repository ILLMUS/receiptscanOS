
-- Create receipts table
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT,
  amount DECIMAL(12,2),
  receipt_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  image_path TEXT,
  image_size_kb NUMERIC(10,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth for now)
CREATE POLICY "Allow all access to receipts"
  ON public.receipts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Storage policies
CREATE POLICY "Allow public read on receipts bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Allow public insert on receipts bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow public delete on receipts bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts');
