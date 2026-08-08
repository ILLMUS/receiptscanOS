ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'home';

ALTER TABLE public.receipts DROP CONSTRAINT IF EXISTS receipts_scope_check;
ALTER TABLE public.receipts ADD CONSTRAINT receipts_scope_check CHECK (scope IN ('home','business'));

UPDATE public.receipts
SET scope = 'business'
WHERE category IN ('welding_supplies','ppe_safety','office_admin','raw_materials','tools_equipment','subcontractor');

CREATE INDEX IF NOT EXISTS receipts_scope_idx ON public.receipts (user_id, scope);