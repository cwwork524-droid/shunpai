ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS bid_increments jsonb NOT NULL DEFAULT '[5, 10, 50]'::jsonb;
