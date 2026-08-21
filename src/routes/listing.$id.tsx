import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BidCount, Countdown } from "@/components/countdown";
import { ExternalLinkButton } from "@/components/external-link-dialog";
import { ImageGallery } from "@/components/image-gallery";
import { ShareBar } from "@/components/share-bar";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { Button } from "@/components/ui/button";
import { getListing, getListingContacts, placeBid, recordView } from "@/lib/auction/server";
import type { ListingContacts, ListingDetail } from "@/lib/auction/types";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn, formatHkd } from "@/lib/utils";

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const id = Number.parseInt(params.id, 10);
    if (!Number.isFinite(id)) return null;
    try {
      return await getListing({ data: { id } });
    } catch {
      return null;
    }
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.title ? `${loaderData.title} · 瞬拍` : "瞬拍";
    const desc = (loaderData?.description ?? "").trim() || "限時競投，即刻成交。";
    const meta: Array<{ title?: string; name?: string; content?: string }> = [
      { title },
      { name: "description", content: desc.slice(0, 160) },
    ];
    if (loaderData?.title) {
      meta.push({ name: "share-title", content: loaderData.title });
    }
    if (loaderData?.images?.[0]) {
      meta.push({ name: "share-image", content: `/api/cover/${params.id}` });
    }
    return { meta };
  },
  component: ListingPage,
});

function ListingPage() {
  const { id } = Route.useParams();
  const listingId = Number.parseInt(id, 10);
  const loaded = Route.useLoaderData();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [listing, setListing] = useState<ListingDetail | null>(loaded ?? null);
  const [contacts, setContacts] = useState<ListingContacts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<5 | 10 | 50 | null>(null);

  async function load() {
    try {
      const data = await getListing({ data: { id: listingId } });
      setListing(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法載入拍賣品");
    }
  }

  useEffect(() => {
    if (!Number.isFinite(listingId)) {
      setError("無效的拍賣品");
      return;
    }
    void load();
    const timer = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    if (loaded) setListing(loaded);
  }, [loaded]);

  useEffect(() => {
    if (!user || !listing) {
      setContacts(null);
      return;
    }
    const maySee =
      listing.status === "sold" &&
      (user.id === listing.sellerId || user.id === listing.winnerId);
    if (!maySee) {
      setContacts(null);
      return;
    }
    let cancelled = false;
    void getListingContacts({ data: { id: listing.id } })
      .then((data) => {
        if (!cancelled) setContacts(data);
      })
      .catch(() => {
        if (!cancelled) setContacts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, listing]);

  useEffect(() => {
    if (!Number.isFinite(listingId)) return;
    const key = `shunpai-viewed-${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    void recordView({ data: { id: listingId } });
  }, [listingId]);

  const isOwner = Boolean(user && listing && user.id === listing.sellerId);
  const live = listing?.status === "active";
  const bidSteps = (listing?.bidIncrements?.length ? listing.bidIncrements : [5, 10, 50]) as (
    | 5
    | 10
    | 50
  )[];

  async function onBid(increment: 5 | 10 | 50) {
    if (!user) {
      await navigate({ to: "/login" });
      return;
    }
    setSubmitting(increment);
    try {
      const result = await placeBid({ data: { listingId, increment } });
      toast.success(`叫價成功 ${formatHkd(result.amount)}`);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "叫價失敗";
      if (message === "Unauthorized") {
        await navigate({ to: "/login" });
        return;
      }
      toast.error(message);
    } finally {
      setSubmitting(null);
    }
  }

  if (error && !listing) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <p className="font-display text-xl">{error}</p>
        <Link to="/" className="mt-6 inline-flex h-11 items-center text-sm font-medium text-accent">
          返回桌面
        </Link>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8">
        <div className="aspect-[4/3] animate-pulse rounded-lg bg-surface-2" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <section className="space-y-5">
        <p className="text-xs font-medium tracking-[0.2em] text-faint">01 物品</p>
        <ImageGallery images={listing.images} alt={listing.title} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{listing.title}</h1>
          {isOwner ? (
            <p className="inline-flex items-center gap-1.5 rounded-sm bg-surface-2 px-2 py-1 text-sm text-muted">
              <Eye className="size-4" />
              <span className="tabular-nums">{listing.viewCount}</span> 次瀏覽
            </p>
          ) : null}
        </div>
        <p className="text-sm text-muted">
          賣家 {listing.status === "sold" || isOwner ? listing.sellerName : "（成交後顯示）"}
        </p>
        {listing.description.trim() ? (
          <p className="whitespace-pre-wrap text-base leading-relaxed text-fg">{listing.description}</p>
        ) : null}
        {listing.youtubeUrl ? <YouTubeEmbed url={listing.youtubeUrl} /> : null}
      </section>

      <div className="my-8 space-y-5 rounded-xl border border-accent/30 bg-accent-soft px-4 py-5">
        <div>
          <p className="text-xs font-medium text-muted">倒數</p>
          <div className="mt-2">
            <Countdown endsAt={listing.endsAt} size="lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted">叫價人數</p>
            <div className="mt-2">
              <BidCount count={listing.bidCount} size="lg" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted">目前叫價</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
              {formatHkd(listing.currentPrice)}
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-5 border-t border-border pt-8">
        <p className="text-xs font-medium tracking-[0.2em] text-faint">02 出價</p>
        {listing.status === "sold" ? (
          <p className="rounded-md bg-surface-2 px-4 py-3 text-sm">
            已成交，成交價 {formatHkd(listing.currentPrice)}
            {user && listing.winnerId === user.id ? "（你是得標者）" : ""}
          </p>
        ) : null}
        {listing.status === "unsold" ? (
          <p className="rounded-md bg-surface-2 px-4 py-3 text-sm">流標，沒有人叫價。</p>
        ) : null}
        {live && isOwner ? (
          <p className="text-sm text-muted">這是你的拍賣品，不能叫價。成交後才會顯示買家名稱同電郵。</p>
        ) : null}
        {live && !isOwner ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">
              每次叫價可加 {bidSteps.map((n) => `$${n}`).join(" / ")}（由賣家設定）
            </p>
            {isPending ? (
              <div className="h-12 animate-pulse rounded-md bg-surface-2" />
            ) : user ? (
              <div className={cn("grid gap-2", bidSteps.length === 1 ? "grid-cols-1" : bidSteps.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                {bidSteps.map((step) => (
                  <Button
                    key={step}
                    type="button"
                    className="h-14 flex-col gap-0.5 text-base"
                    disabled={submitting !== null}
                    onClick={() => void onBid(step)}
                  >
                    <span className="font-display text-lg leading-none">+{formatHkd(step)}</span>
                    <span className="text-xs font-normal opacity-80">
                      {submitting === step ? "提交中…" : formatHkd(listing.currentPrice + step)}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <Button type="button" className="h-12 w-full text-base" asChild>
                <Link to="/login">登入後叫價</Link>
              </Button>
            )}
          </div>
        ) : null}
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted">叫價紀錄</h2>
          {listing.bids.length === 0 ? (
            <p className="text-sm text-faint">尚未有人叫價。</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {listing.bids.map((bid) => (
                <li key={bid.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    {listing.status === "sold" ? bid.bidderName : "買家"}
                    {user && bid.bidderId === user.id ? "（你）" : ""}
                  </span>
                  <span className="font-medium tabular-nums">{formatHkd(bid.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {contacts?.topBuyers && contacts.topBuyers.length > 0 ? (
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-muted">買家聯絡</h2>
            <ol className="space-y-3">
              {contacts.topBuyers.map((buyer, index) => (
                <li key={buyer.userId} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {index + 1}. {buyer.name}
                    </p>
                    {buyer.email ? (
                      <a href={`mailto:${buyer.email}`} className="break-all text-accent">
                        {buyer.email}
                      </a>
                    ) : (
                      <p className="text-faint">沒有電郵</p>
                    )}
                  </div>
                  {buyer.amount != null ? (
                    <span className="shrink-0 font-medium tabular-nums">{formatHkd(buyer.amount)}</span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {contacts?.seller ? (
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-muted">賣家聯絡</h2>
            <p className="text-sm font-medium">{contacts.seller.name}</p>
            {contacts.seller.email ? (
              <a href={`mailto:${contacts.seller.email}`} className="break-all text-sm text-accent">
                {contacts.seller.email}
              </a>
            ) : (
              <p className="text-sm text-faint">沒有電郵</p>
            )}
          </div>
        ) : null}
      </section>

      {listing.websiteUrl ? (
        <section className="mt-8 space-y-4 border-t border-border pt-8">
          <p className="text-xs font-medium tracking-[0.2em] text-faint">03 網站連結</p>
          <ExternalLinkButton href={listing.websiteUrl} name={listing.websiteName} />
        </section>
      ) : null}

      <section className="mt-8 space-y-4 border-t border-border pt-8">
        <p className="text-xs font-medium tracking-[0.2em] text-faint">
          {listing.websiteUrl ? "04 分享" : "03 分享"}
        </p>
        <ShareBar title={listing.title} imageUrl={listing.images[0] ?? null} listingId={listing.id} />
      </section>
    </main>
  );
}
