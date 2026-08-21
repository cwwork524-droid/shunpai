create table if not exists profiles (
  user_id      text primary key,
  display_name text not null default '會員',
  is_admin     boolean not null default false,
  is_blocked   boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists listings (
  id              serial primary key,
  seller_id       text not null,
  title           text not null,
  description     text not null default '',
  images          jsonb not null default '[]'::jsonb,
  website_url     text,
  website_name    text not null default 'Carousell',
  youtube_url     text,
  starting_price  integer not null,
  current_price   integer not null,
  duration_hours  integer not null,
  starts_at       timestamptz not null default now(),
  ends_at         timestamptz not null,
  status          text not null default 'active',
  winner_id       text,
  view_count      integer not null default 0,
  bid_count       integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_status_idx on listings (status);
create index if not exists listings_seller_idx on listings (seller_id);

create table if not exists bids (
  id          serial primary key,
  listing_id  integer not null references listings(id) on delete cascade,
  bidder_id   text not null,
  amount      integer not null,
  created_at  timestamptz not null default now()
);

create index if not exists bids_listing_idx on bids (listing_id, created_at desc);

insert into profiles (user_id, display_name, is_admin, is_blocked) values
  ('seed', '瞬拍精選', false, false),
  ('seed-bidder-1', '阿明', false, false),
  ('seed-bidder-2', '樂樂', false, false),
  ('seed-bidder-3', '阿珍', false, false)
on conflict (user_id) do nothing;

insert into listings (
  seller_id, title, description, images, website_url, website_name, youtube_url,
  starting_price, current_price, duration_hours, starts_at, ends_at, status,
  winner_id, view_count, bid_count, created_at
) values
(
  'seed',
  '德製旁軸菲林相機',
  $$機身有使用痕跡，快門正常，觀景窗清晰。
連原廠皮套與一枚 50mm 鏡頭。
旺角面交優先，可看實物。$$,
  '["/seed/camera.jpg","/seed/camera-2.jpg","/seed/camera-3.jpg"]'::jsonb,
  'https://www.carousell.com.hk/',
  'Carousell',
  null,
  2800, 3450, 2,
  now() - interval '25 minutes', now() + interval '95 minutes',
  'active', null, 128, 4, now() - interval '25 minutes'
),
(
  'seed',
  '靜音機械鍵盤',
  $$白軸，鍵帽幾乎無油光。
原廠線材齊全，適合夜間使用。$$,
  '["/seed/keyboard.jpg"]'::jsonb,
  'https://www.carousell.com.hk/',
  'Carousell',
  null,
  680, 820, 8,
  now() - interval '1 hour', now() + interval '7 hours',
  'active', null, 96, 3, now() - interval '1 hour'
),
(
  'seed',
  '意大利植鞣皮手袋',
  $$ Cognac 色，內裏乾淨。
邊角有極輕微使用痕跡，整體成色很好。$$,
  '["/seed/bag.jpg"]'::jsonb,
  'https://www.carousell.com.hk/',
  'Carousell',
  null,
  1280, 1560, 8,
  now() - interval '40 minutes', now() + interval '7 hours 20 minutes',
  'active', null, 84, 2, now() - interval '40 minutes'
),
(
  'seed',
  '復古高筒波鞋 42碼',
  $$膠底柔軟，鞋面無明顯折痕。
只著過兩次，連原盒。$$,
  '["/seed/sneakers.jpg"]'::jsonb,
  null,
  'Carousell',
  null,
  520, 610, 2,
  now() - interval '50 minutes', now() + interval '70 minutes',
  'active', null, 71, 2, now() - interval '50 minutes'
),
(
  'seed',
  '日本自動上鏈腕錶',
  $$奶油面盤，走時穩定。
有輕微使用痕跡，已過保。$$,
  '["/seed/watch.jpg"]'::jsonb,
  'https://www.carousell.com.hk/',
  'Carousell',
  null,
  1860, 2280, 8,
  now() - interval '2 hours', now() + interval '6 hours',
  'active', null, 55, 3, now() - interval '2 hours'
),
(
  'seed',
  '頭戴式降噪耳機',
  $$耳墊完整，降噪正常。
連收納袋與充電線。$$,
  '["/seed/headphones.jpg"]'::jsonb,
  'https://www.carousell.com.hk/',
  'Carousell',
  null,
  980, 980, 2,
  now() - interval '10 minutes', now() + interval '110 minutes',
  'active', null, 40, 0, now() - interval '10 minutes'
),
(
  'seed',
  '黑膠唱片收藏一套',
  $$五隻一套，封面有歲月感。
碟面以肉眼看無明顯刮花。$$,
  '["/seed/vinyl.jpg"]'::jsonb,
  null,
  'Carousell',
  null,
  360, 420, 8,
  now() - interval '3 hours', now() + interval '5 hours',
  'active', null, 22, 1, now() - interval '3 hours'
),
(
  'seed',
  '手工陶瓷茶具',
  $$一壺兩杯，砂釉手感溫潤。
無裂無衝，已清潔。$$,
  '["/seed/tea.jpg"]'::jsonb,
  'https://www.carousell.com.hk/',
  'Carousell',
  null,
  240, 240, 2,
  now() - interval '2 days', now() - interval '2 days' + interval '2 hours',
  'unsold', null, 12, 0, now() - interval '2 days'
);

insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-1', 3000, now() - interval '22 minutes' from listings where title = '德製旁軸菲林相機';
insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-2', 3200, now() - interval '16 minutes' from listings where title = '德製旁軸菲林相機';
insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-3', 3300, now() - interval '9 minutes' from listings where title = '德製旁軸菲林相機';
insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-1', 3450, now() - interval '4 minutes' from listings where title = '德製旁軸菲林相機';

insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-2', 720, now() - interval '50 minutes' from listings where title = '靜音機械鍵盤';
insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-3', 780, now() - interval '30 minutes' from listings where title = '靜音機械鍵盤';
insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-1', 820, now() - interval '12 minutes' from listings where title = '靜音機械鍵盤';

insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-1', 1400, now() - interval '25 minutes' from listings where title = '意大利植鞣皮手袋';
insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-3', 1560, now() - interval '8 minutes' from listings where title = '意大利植鞣皮手袋';

insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-2', 560, now() - interval '30 minutes' from listings where title = '復古高筒波鞋 42碼';
insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-1', 610, now() - interval '11 minutes' from listings where title = '復古高筒波鞋 42碼';

insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-3', 2000, now() - interval '90 minutes' from listings where title = '日本自動上鏈腕錶';
insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-1', 2140, now() - interval '55 minutes' from listings where title = '日本自動上鏈腕錶';
insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-2', 2280, now() - interval '20 minutes' from listings where title = '日本自動上鏈腕錶';

insert into bids (listing_id, bidder_id, amount, created_at)
select id, 'seed-bidder-2', 420, now() - interval '40 minutes' from listings where title = '黑膠唱片收藏一套';
