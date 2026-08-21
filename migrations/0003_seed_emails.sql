insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
values
  ('seed', '瞬拍精選', 'seller@shunpai.example', true, now(), now()),
  ('seed-bidder-1', '阿明', 'ming@example.com', true, now(), now()),
  ('seed-bidder-2', '樂樂', 'loklok@example.com', true, now(), now()),
  ('seed-bidder-3', '阿珍', 'yan@example.com', true, now(), now())
on conflict (id) do nothing;
