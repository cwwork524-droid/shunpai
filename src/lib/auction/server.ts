import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { isHttpUrl, parseYouTubeId } from "@/lib/utils";
import type {
  AdminUser,
  ContactPerson,
  CreateListingInput,
  ListingCard,
  ListingContacts,
  ListingDetail,
  ListingStatus,
  MineListing,
  ProfileMe,
} from "./types";

type ListingRow = {
  id: number;
  seller_id: string;
  title: string;
  description: string;
  images: unknown;
  website_url: string | null;
  website_name: string;
  youtube_url: string | null;
  starting_price: number;
  current_price: number;
  duration_hours: number;
  starts_at: unknown;
  ends_at: unknown;
  status: string;
  winner_id: string | null;
  view_count: number;
  bid_count: number;
  created_at: unknown;
  seller_name?: string | null;
};

type BidDbRow = {
  id: number;
  bidder_id: string;
  amount: number;
  created_at: unknown;
  bidder_name: string | null;
};

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(String(value)).toISOString();
}

function asInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") return Number.parseInt(value, 10) || 0;
  if (typeof value === "bigint") return Number(value);
  return 0;
}

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

function asImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 3);
  }
  if (typeof value === "string") {
    try {
      return asImages(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

function asStatus(value: string): ListingStatus {
  if (value === "sold" || value === "unsold" || value === "removed" || value === "active") return value;
  return "active";
}

async function settleAndPurge(sql: Sql): Promise<void> {
  await sql`
    delete from bids
    where listing_id in (
      select id from listings where created_at < now() - interval '7 days'
    )
  `;
  await sql`delete from listings where created_at < now() - interval '7 days'`;
  await sql`
    update listings
    set
      status = 'sold',
      winner_id = (
        select b.bidder_id
        from bids b
        where b.listing_id = listings.id
        order by b.amount desc, b.created_at asc
        limit 1
      )
    where status = 'active'
      and ends_at <= now()
      and bid_count > 0
  `;
  await sql`
    update listings
    set status = 'unsold'
    where status = 'active'
      and ends_at <= now()
      and bid_count = 0
  `;
}

async function ensureProfile(sql: Sql, userId: string): Promise<ProfileMe> {
  const users = await sql<{ name: string | null; email: string | null }>`
    select name, email from "user" where id = ${userId}
  `;
  const displayName = (users[0]?.name || users[0]?.email || "會員").trim() || "會員";
  await sql`
    insert into profiles (user_id, display_name, is_admin)
    select ${userId}, ${displayName}, not exists (select 1 from profiles where is_admin = true)
    on conflict (user_id) do update
      set display_name = excluded.display_name
  `;
  const rows = await sql<{
    user_id: string;
    display_name: string;
    is_admin: boolean;
    is_blocked: boolean;
  }>`
    select user_id, display_name, is_admin, is_blocked
    from profiles
    where user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) throw new Error("無法建立帳戶資料");
  return {
    userId: row.user_id,
    displayName: row.display_name,
    isAdmin: asBool(row.is_admin),
    isBlocked: asBool(row.is_blocked),
  };
}

function toCard(
  row: ListingRow,
  rankById: Map<number, number>,
): ListingCard {
  const images = asImages(row.images);
  const status = asStatus(row.status);
  const rank = rankById.get(asInt(row.id)) ?? null;
  return {
    id: asInt(row.id),
    title: row.title,
    coverImage: images[0] ?? null,
    currentPrice: asInt(row.current_price),
    bidCount: asInt(row.bid_count),
    endsAt: asIso(row.ends_at),
    status,
    popularityRank: status === "active" ? rank : null,
    createdAt: asIso(row.created_at),
    durationHours: asInt(row.duration_hours),
  };
}

async function popularityMap(sql: Sql): Promise<Map<number, number>> {
  const rows = await sql<{ id: number }>`
    select id
    from listings
    where status = 'active' and ends_at > now()
    order by view_count desc, id desc
    limit 5
  `;
  const map = new Map<number, number>();
  rows.forEach((row, index) => {
    map.set(asInt(row.id), index + 1);
  });
  return map;
}

function assertImages(images: unknown): string[] {
  if (!Array.isArray(images) || images.length < 1 || images.length > 3) {
    throw new Error("請上載 1 至 3 張圖片");
  }
  const out: string[] = [];
  for (const img of images) {
    if (typeof img !== "string" || img.length < 8) throw new Error("圖片格式不正確");
    if (img.length > 500_000) throw new Error("圖片太大，請壓縮後再試");
    const ok =
      img.startsWith("data:image/") ||
      img.startsWith("/seed/") ||
      img.startsWith("http://") ||
      img.startsWith("https://");
    if (!ok) throw new Error("圖片格式不正確");
    out.push(img);
  }
  return out;
}

function cleanOptionalUrl(value: string, kind: "website" | "youtube"): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (kind === "website") {
    if (!isHttpUrl(trimmed)) throw new Error("網站連結必須是 http 或 https");
    return trimmed;
  }
  if (!parseYouTubeId(trimmed)) throw new Error("YouTube 連結不正確");
  return trimmed;
}

export const listListings = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  await settleAndPurge(sql);
  const ranks = await popularityMap(sql);
  const rows = await sql<ListingRow>`
    select *
    from listings
    where status <> 'removed'
    order by created_at desc, id desc
  `;
  const cards = rows.map((row) => toCard(row, ranks));
  return cards;
});

export const getListing = createServerFn({ method: "GET" })
  .validator((d: { id: number }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await settleAndPurge(sql);
    const id = asInt(data.id);
    const rows = await sql<ListingRow>`
      select l.*, p.display_name as seller_name
      from listings l
      left join profiles p on p.user_id = l.seller_id
      where l.id = ${id} and l.status <> 'removed'
    `;
    const row = rows[0];
    if (!row) throw new Error("找不到這件拍賣品");
    const bidRows = await sql<BidDbRow>`
      select b.id, b.bidder_id, b.amount, b.created_at, p.display_name as bidder_name
      from bids b
      left join profiles p on p.user_id = b.bidder_id
      where b.listing_id = ${id}
      order by b.created_at desc, b.id desc
    `;
    const detail: ListingDetail = {
      id: asInt(row.id),
      sellerId: row.seller_id,
      sellerName: row.seller_name?.trim() || "會員",
      title: row.title,
      description: row.description ?? "",
      images: asImages(row.images),
      websiteUrl: row.website_url,
      websiteName: row.website_name?.trim() || "Carousell",
      youtubeUrl: row.youtube_url,
      startingPrice: asInt(row.starting_price),
      currentPrice: asInt(row.current_price),
      bidCount: asInt(row.bid_count),
      viewCount: asInt(row.view_count),
      endsAt: asIso(row.ends_at),
      startsAt: asIso(row.starts_at),
      durationHours: asInt(row.duration_hours),
      status: asStatus(row.status),
      winnerId: row.winner_id,
      createdAt: asIso(row.created_at),
      bids: bidRows.map((bid) => ({
        id: asInt(bid.id),
        bidderId: bid.bidder_id,
        bidderName: bid.bidder_name?.trim() || "會員",
        amount: asInt(bid.amount),
        createdAt: asIso(bid.created_at),
      })),
    };
    return detail;
  });

export const getListingContacts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }): Promise<ListingContacts> => {
    const sql = await getSql();
    const id = asInt(data.id);
    const rows = await sql<{
      seller_id: string;
      winner_id: string | null;
      status: string;
    }>`
      select seller_id, winner_id, status
      from listings
      where id = ${id} and status <> 'removed'
    `;
    const row = rows[0];
    if (!row) throw new Error("找不到這件拍賣品");

    const isSeller = context.userId === row.seller_id;
    const isWinner = row.status === "sold" && context.userId === row.winner_id;
    if (!isSeller && !isWinner) throw new Error("沒有權限查看聯絡資料");

    let topBuyers: ContactPerson[] | null = null;
    if (isSeller) {
      const buyers = await sql<{
        bidder_id: string;
        name: string | null;
        email: string | null;
        amount: number;
      }>`
        select
          b.bidder_id,
          coalesce(p.display_name, u.name, '會員') as name,
          u.email,
          max(b.amount) as amount
        from bids b
        left join profiles p on p.user_id = b.bidder_id
        left join "user" u on u.id = b.bidder_id
        where b.listing_id = ${id}
        group by b.bidder_id, p.display_name, u.name, u.email
        order by max(b.amount) desc
        limit 3
      `;
      topBuyers = buyers.map((buyer) => ({
        userId: buyer.bidder_id,
        name: buyer.name?.trim() || "會員",
        email: buyer.email?.trim() || null,
        amount: asInt(buyer.amount),
      }));
    }

    let seller: ContactPerson | null = null;
    if (isWinner) {
      const sellers = await sql<{
        name: string | null;
        email: string | null;
      }>`
        select coalesce(p.display_name, u.name, '會員') as name, u.email
        from listings l
        left join profiles p on p.user_id = l.seller_id
        left join "user" u on u.id = l.seller_id
        where l.id = ${id}
      `;
      seller = {
        userId: row.seller_id,
        name: sellers[0]?.name?.trim() || "會員",
        email: sellers[0]?.email?.trim() || null,
      };
    }

    return { topBuyers, seller };
  });

export const recordView = createServerFn({ method: "POST" })
  .validator((d: { id: number }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      update listings
      set view_count = view_count + 1
      where id = ${asInt(data.id)} and status <> 'removed'
    `;
    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return ensureProfile(sql, context.userId);
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: CreateListingInput) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    if (profile.isBlocked) throw new Error("帳戶已被封鎖，無法刊登");
    const title = data.title.trim();
    if (title.length < 1 || title.length > 80) throw new Error("名稱須為 1 至 80 字");
    const description = (data.description ?? "").slice(0, 4000);
    const images = assertImages(data.images);
    const startingPrice = asInt(data.startingPrice);
    if (startingPrice < 1 || startingPrice > 10_000_000) throw new Error("起拍價不正確");
    const durationHours = data.durationHours === 8 ? 8 : data.durationHours === 2 ? 2 : 0;
    if (durationHours !== 2 && durationHours !== 8) throw new Error("拍賣時限只可選 2 小時或 8 小時");
    const websiteUrl = cleanOptionalUrl(data.websiteUrl ?? "", "website");
    const websiteName = (data.websiteName ?? "").trim() || "Carousell";
    if (websiteName.length > 40) throw new Error("網站名稱太長");
    const youtubeUrl = cleanOptionalUrl(data.youtubeUrl ?? "", "youtube");
    const imagesJson = JSON.stringify(images);
    const rows = await sql<{ id: number }>`
      insert into listings (
        seller_id, title, description, images, website_url, website_name, youtube_url,
        starting_price, current_price, duration_hours, starts_at, ends_at, status
      ) values (
        ${context.userId},
        ${title},
        ${description},
        ${imagesJson}::jsonb,
        ${websiteUrl},
        ${websiteName},
        ${youtubeUrl},
        ${startingPrice},
        ${startingPrice},
        ${durationHours},
        now(),
        now() + (${durationHours} * interval '1 hour'),
        'active'
      )
      returning id
    `;
    const id = asInt(rows[0]?.id);
    if (!id) throw new Error("刊登失敗");
    return { id };
  });

export const placeBid = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { listingId: number; amount: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await settleAndPurge(sql);
    const profile = await ensureProfile(sql, context.userId);
    if (profile.isBlocked) throw new Error("帳戶已被封鎖，無法叫價");
    const listingId = asInt(data.listingId);
    const amount = asInt(data.amount);
    if (amount < 1) throw new Error("叫價金額不正確");
    const rows = await sql<ListingRow>`
      select * from listings where id = ${listingId} and status <> 'removed'
    `;
    const listing = rows[0];
    if (!listing) throw new Error("找不到這件拍賣品");
    if (listing.seller_id === context.userId) throw new Error("不能對自己的拍賣品叫價");
    if (asStatus(listing.status) !== "active") throw new Error("拍賣已結束");
    if (new Date(asIso(listing.ends_at)).getTime() <= Date.now()) throw new Error("拍賣已結束");
    const bidCount = asInt(listing.bid_count);
    const current = asInt(listing.current_price);
    const min = bidCount === 0 ? current : current + 1;
    if (amount < min) throw new Error(`叫價須至少 ${min}`);
    const updated = await sql<{ id: number }>`
      update listings
      set current_price = ${amount}, bid_count = bid_count + 1
      where id = ${listingId}
        and status = 'active'
        and ends_at > now()
        and (
          (bid_count = 0 and ${amount} >= current_price)
          or (bid_count > 0 and ${amount} > current_price)
        )
      returning id
    `;
    if (!updated[0]) throw new Error("叫價失敗，可能已有更高叫價");
    await sql`
      insert into bids (listing_id, bidder_id, amount)
      values (${listingId}, ${context.userId}, ${amount})
    `;
    return { ok: true };
  });

export const listMine = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await settleAndPurge(sql);
    await ensureProfile(sql, context.userId);
    const ranks = await popularityMap(sql);
    const rows = await sql<ListingRow>`
      select *
      from listings
      where seller_id = ${context.userId} and status <> 'removed'
      order by created_at desc, id desc
    `;
    return rows.map((row) => {
      const card = toCard(row, ranks);
      const mine: MineListing = {
        ...card,
        viewCount: asInt(row.view_count),
        startingPrice: asInt(row.starting_price),
      };
      return mine;
    });
  });

export const relistListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await settleAndPurge(sql);
    const profile = await ensureProfile(sql, context.userId);
    if (profile.isBlocked) throw new Error("帳戶已被封鎖，無法重新拍賣");
    const id = asInt(data.id);
    const rows = await sql<ListingRow>`
      select * from listings where id = ${id} and seller_id = ${context.userId}
    `;
    const listing = rows[0];
    if (!listing) throw new Error("找不到這件拍賣品");
    if (asStatus(listing.status) !== "unsold") throw new Error("只有流標物品可以重新拍賣");
    await sql`delete from bids where listing_id = ${id}`;
    const hours = asInt(listing.duration_hours) === 8 ? 8 : 2;
    await sql`
      update listings
      set
        status = 'active',
        winner_id = null,
        current_price = starting_price,
        bid_count = 0,
        starts_at = now(),
        ends_at = now() + (${hours} * interval '1 hour')
      where id = ${id} and seller_id = ${context.userId} and status = 'unsold'
    `;
    return { ok: true };
  });

export const adminRemoveListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    if (!profile.isAdmin) throw new Error("沒有管理員權限");
    await sql`
      update listings set status = 'removed' where id = ${asInt(data.id)}
    `;
    return { ok: true };
  });

export const adminSetBlocked = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { userId: string; blocked: boolean }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    if (!profile.isAdmin) throw new Error("沒有管理員權限");
    if (data.userId === context.userId) throw new Error("不能封鎖自己");
    const updated = await sql<{ user_id: string }>`
      update profiles
      set is_blocked = ${Boolean(data.blocked)}
      where user_id = ${data.userId}
      returning user_id
    `;
    if (!updated[0]) throw new Error("找不到用戶");
    return { ok: true };
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await settleAndPurge(sql);
    const profile = await ensureProfile(sql, context.userId);
    if (!profile.isAdmin) throw new Error("沒有管理員權限");
    const ranks = await popularityMap(sql);
    const listingRows = await sql<ListingRow>`
      select * from listings order by created_at desc, id desc
    `;
    const userRows = await sql<{
      user_id: string;
      display_name: string;
      is_admin: boolean;
      is_blocked: boolean;
      created_at: unknown;
    }>`
      select user_id, display_name, is_admin, is_blocked, created_at
      from profiles
      order by created_at desc
    `;
    const listings = listingRows.map((row) => ({
      ...toCard(row, ranks),
      viewCount: asInt(row.view_count),
      sellerId: row.seller_id,
      status: asStatus(row.status),
    }));
    const users: AdminUser[] = userRows.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      isAdmin: asBool(row.is_admin),
      isBlocked: asBool(row.is_blocked),
      createdAt: asIso(row.created_at),
    }));
    return { listings, users };
  });

export async function listingCoverResponse(id: number): Promise<Response> {
  if (!Number.isFinite(id) || id < 1) {
    return new Response("Not found", { status: 404 });
  }
  const sql = await getSql();
  const rows = await sql<{ images: unknown }>`
    select images from listings
    where id = ${id} and status <> 'removed'
    limit 1
  `;
  const src = asImages(rows[0]?.images)[0];
  if (!src) return new Response("Not found", { status: 404 });

  const headers = (type: string, cache = "public, max-age=600") => ({
    "Content-Type": type,
    "Cache-Control": cache,
    "Content-Disposition": 'inline; filename="cover.jpg"',
  });

  if (src.startsWith("data:")) {
    const match = /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/.exec(src);
    if (!match) return new Response("Not found", { status: 404 });
    const body = Buffer.from(match[2].replace(/\s/g, ""), "base64");
    return new Response(body, { headers: headers(match[1]) });
  }

  if (src.startsWith("/seed/") && /^\/seed\/[A-Za-z0-9._-]+$/.test(src)) {
    try {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const name = src.slice("/seed/".length);
      const body = await readFile(join(process.cwd(), "public", "seed", name));
      const type = name.endsWith(".png") ? "image/png" : "image/jpeg";
      return new Response(body, { headers: headers(type, "public, max-age=86400") });
    } catch {
      return new Response(null, { status: 302, headers: { Location: src } });
    }
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return new Response(null, { status: 302, headers: { Location: src } });
  }

  return new Response("Not found", { status: 404 });
}
