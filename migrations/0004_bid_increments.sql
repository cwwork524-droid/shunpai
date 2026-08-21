alter table listings
  add column if not exists bid_increments jsonb not null default '[5,10,50]'::jsonb;
