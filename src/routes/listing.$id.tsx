import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BidCount, Countdown } from "@/components/countdown";
import { ExternalLinkButton } from "@/components/external-link-dialog";
import { ImageGallery } from "@/components/image-gallery";
import { ShareBar } from "@/components/share-bar";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getListing, placeBid, recordView } from "@/lib/auction/server";
import type { ListingDetail } from "@/lib/auction/types";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatHkd } from "@/lib/utils";

export const Route = createFileRoute("/listing/$id")({
  component: ListingPage,
});

function ListingPage() {
  const { id } = Route.useParams();
  const listingId = Number.parseInt(id, 10);
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const minBid = useMemo(() => {
    if (!listing) return 1;
    return listing.bidCount === 0 ? listing.currentPrice : listing.currentPrice + 1;
  }, [listing]);

  useEffect(() => {
    if (listing) setAmount(String(minBid));
  }, [listing, minBid]);

  const isOwner = Boolean(user && listing && user.id === listing.sellerId);
  const live = listing?.status === "active";

  async function onBid(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      await navigate({ to: "/login" });
      return;
    }
    setSubmitting(true);
    try {
      await placeBid({ data: { listingId, amount: Number.parseInt(amount, 10) } });
      toast.success("叫價成功");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "叫價失敗";
      if (message === "Unauthorized") {
        await navigate({ to: "/login" });
        return;
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
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
        <p className="text-sm text-muted">賣家 {listing.sellerName}</p>
        {listing.description.trim() ? (
          <p className="whitespace-pre-wrap text-base leading-relaxed text-fg">{listing.description}</p>
        ) : null}
        {listing.youtubeUrl ? <YouTubeEmbed url={listing.youtubeUrl} /> : null}
      </section>

      <div className="my-8 grid grid-cols-2 gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-muted">倒數</p>
          <div className="mt-2">
            <Countdown endsAt={listing.endsAt} size="lg" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">叫價人數</p>
          <div className="mt-2">
            <BidCount count={listing.bidCount} size="lg" />
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-muted">目前叫價</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
            {formatHkd(listing.currentPrice)}
          </p>
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
          <p className="text-sm text-muted">這是你的拍賣品，不能叫價。結束後可在「我的」查看瀏覽次數。</p>
        ) : null}
        {live && !isOwner ? (
          <form onSubmit={(e) => void onBid(e)} className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="space-y-2">
              <Label htmlFor="bid">叫價（最低 {formatHkd(minBid)}）</Label>
              <Input
                id="bid"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
            {isPending ? (
              <div className="h-12 animate-pulse rounded-md bg-surface-2" />
            ) : user ? (
              <Button type="submit" className="h-12 w-full text-base" disabled={submitting}>
                {submitting ? "提交中…" : "確認叫價"}
              </Button>
            ) : (
              <Button type="button" className="h-12 w-full text-base" asChild>
                <Link to="/login">登入後叫價</Link>
              </Button>
            )}
          </form>
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
                    {bid.bidderName}
                    {user && bid.bidderId === user.id ? "（你）" : ""}
                  </span>
                  <span className="font-medium tabular-nums">{formatHkd(bid.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
        <ShareBar title={listing.title} />
      </section>
    </main>
  );
}
